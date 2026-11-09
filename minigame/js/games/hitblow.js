// GAME: HIT & BLOW (guess a secret of distinct digits; 3-digit and 4-digit modes)
// Hit = right digit in the right place, Blow = right digit in a different place.
function hitBlowJudge(secret,guess){
  let hit=0,blow=0;
  for(let i=0;i<guess.length;i++){if(guess[i]===secret[i])hit++;else if(secret.includes(guess[i]))blow++;}
  return {hit,blow};
}
function hitBlowSecret(len,random=Math.random){
  const digits=[0,1,2,3,4,5,6,7,8,9];
  for(let i=digits.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[digits[i],digits[j]]=[digits[j],digits[i]];}
  return digits.slice(0,len);
}
games.hitblow=function(el){
  const MODES={3:{len:3,tries:10,base:500,color:'var(--accent3)'},4:{len:4,tries:12,base:1000,color:'var(--accent5)'}};
  let mode=null,secret=[],input=[],history=[],memo=Array(10).fill(0),ended=false;
  const q=id=>el.querySelector('#'+id);
  const MEMO_MARK=['','✕','○'];

  function menu(){
    ended=true;
    el.innerHTML=`<div class="game-header"><h2>🔍 ヒット＆ブロー</h2><p>隠された数字を推理して当てよう</p></div>
      <div class="hb-howto">
        <div><b class="hb-h">ヒット</b> 数字と位置が両方合っている</div>
        <div><b class="hb-b">ブロー</b> 数字は合っているが位置が違う</div>
        <small>使う数字は0〜9。同じ数字は2回使われません（先頭の0もあり）。</small>
      </div>
      <div class="hb-modes">
        ${Object.values(MODES).map(m=>`<button class="hb-mode" data-hb-mode="${m.len}" style="--mc:${m.color}"><span class="hb-mode-digits">${'?'.repeat(m.len).split('').map(c=>`<i>${c}</i>`).join('')}</span><strong>${m.len}桁モード</strong><small>${m.tries}回以内に当てる${m.len===4?'・高得点':''}</small></button>`).join('')}
      </div>`;
    el.querySelectorAll('[data-hb-mode]').forEach(b=>b.onclick=()=>start(Number(b.dataset.hbMode)));
  }

  function start(len){
    mode=MODES[len];secret=hitBlowSecret(len);input=[];history=[];memo=Array(10).fill(0);ended=false;
    el.innerHTML=`<div class="game-header"><h2>🔍 ヒット＆ブロー</h2><p>${len}桁・0〜9の重複しない数字</p></div>
      <div class="info-row">
        <div class="info-box"><div class="ib-val">${len}桁</div><div class="ib-label">モード</div></div>
        <div class="info-box"><div class="ib-val" id="hb-left">${mode.tries}</div><div class="ib-label">残り回数</div></div>
        <div class="info-box"><div class="ib-val" id="hb-count">0</div><div class="ib-label">予想した回数</div></div>
      </div>
      <div class="hb-history" id="hb-history" aria-live="polite"></div>
      <div class="hb-entry" id="hb-entry" aria-label="入力中の数字"></div>
      <p class="hb-status" id="hb-status" role="status"></p>
      <div class="hb-pad" id="hb-pad">
        ${[1,2,3,4,5,6,7,8,9,0].map(d=>`<button class="hb-key" data-digit="${d}">${d}</button>`).join('')}
        <button class="hb-key hb-del" data-act="del" aria-label="1文字消す">⌫</button>
        <button class="hb-key hb-go" data-act="go">決定</button>
      </div>
      <div class="hb-memo-wrap"><div class="hb-memo-title">メモ <small>タップで ✕ → ○ → なし</small></div><div class="hb-memo" id="hb-memo"></div></div>
      <div class="flex-center mt"><button class="btn btn-sm" id="hb-giveup">🏳️ 降参して答えを見る</button><button class="btn btn-sm" id="hb-menu">モード選択</button></div>
      <div id="hb-result"></div>`;
    q('hb-pad').onclick=e=>{const b=e.target.closest('button');if(!b||b.disabled)return;if(b.dataset.act==='del')del();else if(b.dataset.act==='go')submit();else type(Number(b.dataset.digit));};
    q('hb-memo').onclick=e=>{const b=e.target.closest('[data-memo]');if(!b)return;const d=Number(b.dataset.memo);memo[d]=(memo[d]+1)%3;renderMemo();};
    q('hb-giveup').onclick=()=>{if(!ended)finish(false,true);};
    q('hb-menu').onclick=()=>startGame('hitblow');
    render('数字を選んで「決定」を押そう');
  }

  function type(d){
    if(ended||input.length>=mode.len||input.includes(d))return;
    input.push(d);playSfx('click');render();
  }
  function del(){if(ended||!input.length)return;input.pop();render();}
  function submit(){
    if(ended)return;
    if(input.length<mode.len){render(`${mode.len}桁そろえてから決定してね`,'bad');shakeEntry();return;}
    if(history.some(h=>h.guess.join('')===input.join(''))){render('その数字はもう予想しました','bad');shakeEntry();return;}
    const r=hitBlowJudge(secret,input);history.push({guess:input.slice(),...r});input=[];
    if(r.hit===mode.len){finish(true);return;}
    if(history.length>=mode.tries){finish(false);return;}
    playSfx(r.hit?'pop':'click');
    render(r.hit||r.blow?`${r.hit}ヒット ${r.blow}ブロー！`:'0ヒット 0ブロー：この数字はどれも入っていない');
  }
  function shakeEntry(){const e=q('hb-entry');if(!e)return;e.classList.remove('shake');void e.offsetWidth;e.classList.add('shake');playSfx('warn');}

  function pegs(r){return `<span class="hb-pegs" aria-hidden="true">${'<i class="h"></i>'.repeat(r.hit)}${'<i class="b"></i>'.repeat(r.blow)}${'<i></i>'.repeat(mode.len-r.hit-r.blow)}</span>`;}
  function render(message,tone=''){
    q('hb-left').textContent=mode.tries-history.length;q('hb-count').textContent=history.length;
    q('hb-history').innerHTML=history.length?history.map((h,i)=>`<div class="hb-row${h.hit===mode.len?' win':''}"><span class="hb-no">${i+1}</span><span class="hb-digits">${h.guess.map(d=>`<i class="m${memo[d]}">${d}</i>`).join('')}</span>${pegs(h)}<span class="hb-score"><b class="hb-h">${h.hit}H</b><b class="hb-b">${h.blow}B</b></span></div>`).join(''):'<div class="hb-empty">まだ予想はありません</div>';
    const box=q('hb-history');box.scrollTop=box.scrollHeight;
    q('hb-entry').innerHTML=Array.from({length:mode.len},(_,i)=>`<span class="hb-slot${i===input.length&&!ended?' cur':''}${input[i]!==undefined?' on':''}">${input[i]??''}</span>`).join('');
    el.querySelectorAll('[data-digit]').forEach(b=>{const d=Number(b.dataset.digit);b.disabled=ended||input.includes(d)||input.length>=mode.len;b.className=`hb-key m${memo[d]}`;});
    q('hb-pad').querySelector('[data-act="del"]').disabled=ended||!input.length;
    q('hb-pad').querySelector('[data-act="go"]').disabled=ended||input.length<mode.len;
    q('hb-giveup').disabled=ended;
    if(message!==undefined){const s=q('hb-status');s.textContent=message;s.dataset.tone=tone;}
    renderMemo();
  }
  function renderMemo(){
    const m=q('hb-memo');if(!m)return;
    m.innerHTML=[0,1,2,3,4,5,6,7,8,9].map(d=>`<button class="hb-memo-key m${memo[d]}" data-memo="${d}" aria-label="${d}のメモ：${['なし','含まれない','含まれる'][memo[d]]}">${d}<small>${MEMO_MARK[memo[d]]}</small></button>`).join('');
    el.querySelectorAll('.hb-digits i').forEach(i=>{i.className='m'+memo[Number(i.textContent)];});
    el.querySelectorAll('[data-digit]').forEach(b=>{const d=Number(b.dataset.digit);b.classList.remove('m0','m1','m2');b.classList.add('m'+memo[d]);});
  }

  function finish(won,gaveUp=false){
    ended=true;
    const tries=history.length,score=won?Math.max(50,Math.round(mode.base*(mode.tries-tries+1)/mode.tries)):0;
    render(won?`🎉 ${tries}回で正解！`:gaveUp?'降参しました':'残念…回数切れ',won?'good':'bad');
    q('hb-result').innerHTML=`<div class="result-box mt"><p>答え</p><div class="hb-answer">${secret.map(d=>`<span>${d}</span>`).join('')}</div><p>${won?`${tries}回で正解・スコア ${score.toLocaleString()}`:'次はきっと当てられる！'}</p><button class="btn mt" onclick="startGame('hitblow')">もう一度</button></div>`;
    // Shown inside the shared result overlay, which covers the board.
    if(typeof resultSession!=='undefined'&&resultSession?.gameId==='hitblow')resultSession.detailHtml=`<div class="hb-result-answer"><small>答え</small><div class="hb-answer">${secret.map(d=>`<span>${d}</span>`).join('')}</div><small>${won?`${tries}回で正解`:`${tries}回予想`}</small></div>`;
    if(won)recordWin('hitblow',score);else recordLoss(0,'hitblow');
  }

  function onKey(e){
    if(ended||!mode||e.target.closest?.('input,textarea'))return;
    if(/^[0-9]$/.test(e.key)){e.preventDefault();type(Number(e.key));}
    else if(e.key==='Backspace'){e.preventDefault();del();}
    else if(e.key==='Enter'){e.preventDefault();submit();}
  }
  document.addEventListener('keydown',onKey);
  menu();
  el._cleanup=()=>{ended=true;document.removeEventListener('keydown',onKey);};
};
