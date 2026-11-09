
// GAME: HIGH & LOW STREAK
games.highlow=function(el){
  const SUITS=['♠','♥','♦','♣'],RANKS=['','A','2','3','4','5','6','7','8','9','10','J','Q','K'],GOAL=10;
  let current,streak=0,bank=0,shield=true,busy=false,ended=false,history=[];
  const q=id=>el.querySelector('#'+id);
  const drawCard=()=>({rank:1+Math.floor(Math.random()*13),suit:SUITS[Math.floor(Math.random()*4)]});
  const isRed=c=>c.suit==='♥'||c.suit==='♦';
  const cardHtml=(c,id='')=>`<div class="hl-card ${isRed(c)?'red':''}" ${id?`id="${id}"`:''}><span class="hl-corner">${RANKS[c.rank]}<br>${c.suit}</span><span>${RANKS[c.rank]}</span><span class="hl-suit">${c.suit}</span></div>`;
  const nextGain=()=>10*2**streak;
  const pct=n=>Math.round(n/13*100)+'%';
  const HL_KEYS={ArrowUp:'hl-high',ArrowDown:'hl-low',s:'hl-same',d:'hl-drop'};
  onGameKey(key=>{const id=HL_KEYS[key];if(!id)return false;q(id)?.click();return true;});
  function start(){
    current=drawCard();streak=0;bank=0;shield=true;busy=false;ended=false;history=[];
    el.innerHTML=`<div class="game-header"><h2>🃏 ハイ＆ロー・ストリーク</h2><p>次のカードは大きい？小さい？（A＝1〜K＝13）</p><p class="kbd-hint"><kbd>↑</kbd> HIGH／<kbd>↓</kbd> LOW／<kbd>S</kbd> SAME／<kbd>D</kbd> ドロップ</p></div>
      <div class="info-row">
        <div class="info-box"><div class="ib-val" id="hl-streak">0/${GOAL}</div><div class="ib-label">連勝</div></div>
        <div class="info-box"><div class="ib-val" id="hl-bank">0</div><div class="ib-label">獲得スコア</div></div>
        <div class="info-box"><div class="ib-val" id="hl-shield">🛡️</div><div class="ib-label">シールド</div></div>
      </div>
      <div class="hl-stage"><div id="hl-current"></div><div class="hl-arrow">→</div><div id="hl-next"><div class="hl-card back"></div></div></div>
      <p class="center" id="hl-status" aria-live="polite">予想を選ぼう！ 次の1勝で <strong>+${nextGain()}</strong></p>
      <div class="hl-actions">
        <button class="btn" id="hl-high">▲ HIGH<small id="hl-high-p"></small></button>
        <button class="btn btn-purple" id="hl-same">🎯 SAME<small id="hl-same-p"></small></button>
        <button class="btn btn-danger" id="hl-low">▼ LOW<small id="hl-low-p"></small></button>
      </div>
      <button class="btn btn-warn hl-drop" id="hl-drop">💰 ドロップして確定</button>
      <div class="hl-history" id="hl-history"></div>`;
    q('hl-high').onclick=()=>guess('high');q('hl-low').onclick=()=>guess('low');q('hl-same').onclick=()=>guess('same');q('hl-drop').onclick=drop;
    render();
  }
  function render(){
    q('hl-current').innerHTML=cardHtml(current);
    q('hl-streak').textContent=`${streak}/${GOAL}`;q('hl-bank').textContent=bank.toLocaleString();q('hl-shield').textContent=shield?'🛡️':'—';
    q('hl-high-p').textContent=pct(13-current.rank);q('hl-low-p').textContent=pct(current.rank-1);q('hl-same-p').textContent=pct(1)+'・4倍';
    q('hl-high').disabled=busy||ended||current.rank===13;q('hl-low').disabled=busy||ended||current.rank===1;q('hl-same').disabled=busy||ended;
    const drop=q('hl-drop');drop.disabled=busy||ended||streak<3;drop.textContent=streak<3?`💰 ドロップは3連勝から（あと${3-streak}）`:`💰 ${bank.toLocaleString()}点でドロップして確定`;
    q('hl-history').innerHTML=history.map(h=>`<span class="${h.ok?'ok':'ng'}">${RANKS[h.rank]}${h.ok?'○':'×'}</span>`).join('');
  }
  function status(html){q('hl-status').innerHTML=html;}
  function guess(kind){
    if(busy||ended)return;busy=true;render();
    const next=drawCard();
    q('hl-next').innerHTML=cardHtml(next,'hl-flip');playSfx('click');
    const ok=kind==='high'?next.rank>current.rank:kind==='low'?next.rank<current.rank:next.rank===current.rank;
    gameDelay(()=>{
      if(ended)return;
      history.push({rank:next.rank,ok});history=history.slice(-12);
      if(ok){
        const gain=nextGain()*(kind==='same'?4:1);bank+=gain;streak++;playSfx(kind==='same'?'combo':'pop');
        status(`${kind==='same'?'🎯 ぴったり！':'⭕ 正解！'} +${gain}点${streak<GOAL?`・次の1勝で <strong>+${nextGain()}</strong>`:''}`);
      }else if(shield){
        shield=false;playSfx('warn');status('🛡️ シールドがミスを防いだ！ 連勝はそのまま');
      }else{
        ended=true;playSfx('loss');current=next;busy=false;render();
        status(`❌ はずれ…（${RANKS[next.rank]}）獲得スコアは没収されました`);
        showEnd(0,`${streak}連勝でストップ`);recordLoss(0,'highlow');return;
      }
      current=next;busy=false;
      gameDelay(()=>{if(!ended&&q('hl-next'))q('hl-next').innerHTML='<div class="hl-card back"></div>';},350);
      if(streak>=GOAL){const final=Math.round(bank*1.5);ended=true;render();status(`🏆 ${GOAL}連勝達成！ 完走ボーナス×1.5で ${final.toLocaleString()}点`);showEnd(final,`${GOAL}連勝完走！`);recordWin('highlow',final);return;}
      render();
    },650);
  }
  function drop(){
    if(busy||ended||streak<3)return;ended=true;render();
    status(`💰 ${streak}連勝でドロップ！ ${bank.toLocaleString()}点を確定`);showEnd(bank,`${streak}連勝でドロップ`);recordWin('highlow',bank);
  }
  function showEnd(score,text){
    el.insertAdjacentHTML('beforeend',`<div class="result-box"><div class="result-score">${score.toLocaleString()}</div><p>${text}</p><button class="btn mt" onclick="startGame('highlow')">もう一度</button></div>`);
  }
  start();
  el._cleanup=()=>{ended=true;};
};
