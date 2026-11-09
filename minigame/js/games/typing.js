
// GAME 23: TYPING RUSH
games.typing = function(el) {
  const WORDS={
    easy:['apple','blue','cat','dream','fish','game','happy','jump','king','lemon','moon','nice','orange','panda','quick','rain','smile','star','tree','water'],
    normal:['adventure','browser','challenge','diamond','energy','festival','galaxy','holiday','island','journey','keyboard','library','monster','network','picture','rocket','silver','tiger','victory','window'],
    hard:['achievement','beautiful','championship','development','electricity','extraordinary','imagination','javascript','knowledge','mysterious','opportunity','performance','revolution','synchronize','technology','university','vocabulary','wonderful']
  };
  const LEVELS={easy:{name:'かんたん',mult:1,color:'#6bcb77'},normal:{name:'ふつう',mult:1.35,color:'#4d96ff'},hard:{name:'むずかしい',mult:1.7,color:'#ff6b6b'}};
  let timer=null,ended=false,current='',score=0,words=0,combo=0,maxCombo=0,correctChars=0,errors=0,level='normal',endAt=0;

  function renderMenu(){
    el.innerHTML=`<div class="game-header"><h2>⌨️ タイピングラッシュ</h2><p>30秒で、いくつの単語を入力できる？</p></div>
      <div class="result-box"><h3>難易度を選択</h3><div class="flex-center mt">
      ${Object.entries(LEVELS).map(([id,d])=>`<button class="btn" style="background:${d.color}" data-level="${id}">${d.name}<br><small>スコア ×${d.mult}</small></button>`).join('')}
      </div><div class="meta-sub mt">表示された英単語をそのまま入力。完成すると自動で次の単語へ進みます。</div></div>`;
    el.querySelectorAll('[data-level]').forEach(b=>b.addEventListener('click',()=>start(b.dataset.level)));
  }
  function pickWord(){
    const pool=WORDS[level],previous=current;let next;
    do{next=pool[Math.floor(Math.random()*pool.length)];}while(next===previous&&pool.length>1);
    current=next;el.querySelector('#typing-word').textContent=current;
  }
  function updateHud(){
    el.querySelector('#typing-score').textContent=score.toLocaleString();
    el.querySelector('#typing-words').textContent=words;
    el.querySelector('#typing-combo').textContent=combo;
  }
  function start(selected){
    level=selected;ended=false;score=words=combo=maxCombo=correctChars=errors=0;current='';
    el.innerHTML=`<div class="game-header"><h2>⌨️ タイピングラッシュ</h2><p>${LEVELS[level].name} ／ 30秒チャレンジ</p></div>
      <div class="info-row">
        <div class="info-box"><div class="ib-val" id="typing-time">30</div><div class="ib-label">残り秒</div></div>
        <div class="info-box"><div class="ib-val" id="typing-score">0</div><div class="ib-label">スコア</div></div>
        <div class="info-box"><div class="ib-val" id="typing-words">0</div><div class="ib-label">単語</div></div>
        <div class="info-box"><div class="ib-val" id="typing-combo">0</div><div class="ib-label">コンボ</div></div>
      </div>
      <div class="typing-word" id="typing-word"></div>
      <input class="typing-input" id="typing-input" type="text" inputmode="text" autocomplete="off" autocapitalize="none" spellcheck="false" aria-label="表示された単語を入力">
      <div class="typing-feedback" id="typing-feedback">入力スタート！</div>`;
    const input=el.querySelector('#typing-input'),feedback=el.querySelector('#typing-feedback');
    pickWord();endAt=performance.now()+30000;
    input.addEventListener('input',e=>{
      if(ended)return;
      const value=input.value.toLowerCase();
      if(value===current){
        correctChars+=current.length;words++;combo++;maxCombo=Math.max(maxCombo,combo);
        const gained=Math.round((current.length*12+combo*5)*LEVELS[level].mult);score+=gained;
        feedback.textContent=`スコア +${gained}  ${combo>=3?'🔥 '+combo+'コンボ！':'正解！'}`;feedback.style.color='var(--accent2)';
        input.value='';input.classList.remove('wrong');pickWord();updateHud();return;
      }
      const correctPrefix=current.startsWith(value);
      input.classList.toggle('wrong',!correctPrefix);
      if(!correctPrefix){if(e.inputType?.startsWith('insert'))errors++;combo=0;feedback.textContent='入力ミス！';feedback.style.color='var(--accent1)';updateHud();}
      else {feedback.textContent='';feedback.style.color='';}
    });
    timer=setInterval(()=>{
      const left=Math.max(0,endAt-performance.now());el.querySelector('#typing-time').textContent=Math.ceil(left/1000);
      if(left<=0)finish();
    },100);
    gameDelay(()=>input.focus(),80);
  }
  function finish(){
    if(ended)return;ended=true;clearInterval(timer);timer=null;
    const accuracy=Math.round(correctChars/Math.max(1,correctChars+errors)*100),wpm=words*2,won=score>=500;
    if(won)recordWin('typing',score);else recordLoss(score,'typing');
    el.innerHTML=`<div class="game-header"><h2>⌨️ タイピングラッシュ 結果</h2><p>${LEVELS[level].name}</p></div>
      <div class="result-box"><div class="result-score">${score.toLocaleString()}</div><p>${won?'🎉 目標達成！':'あと少し！500点で勝利'}</p>
      <div class="info-row mt">
        <div class="info-box"><div class="ib-val">${words}</div><div class="ib-label">入力単語</div></div>
        <div class="info-box"><div class="ib-val">${wpm}</div><div class="ib-label">WPM</div></div>
        <div class="info-box"><div class="ib-val">${accuracy}%</div><div class="ib-label">正確率</div></div>
        <div class="info-box"><div class="ib-val">${maxCombo}</div><div class="ib-label">最大コンボ</div></div>
      </div>${won?xpResultHtml(score,'typing'):''}
      <div class="flex-center mt"><button class="btn btn-warn" onclick="startGame('typing')">もう一度</button><button class="btn btn-sm" style="background:var(--surface2)" onclick="goHome()">ホームへ</button></div></div>`;
  }
  renderMenu();
  el._cleanup=()=>{ended=true;if(timer)clearInterval(timer);};
};
