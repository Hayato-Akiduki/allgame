
// GAME: WHACK-A-MOLE RUSH
games.whackamole=function(el){
  const DURATION=30000,WIN_SCORE=350,KEYS='123456789';
  let holes=[],score=0,combo=0,bestCombo=0,timeLeft=DURATION,endAt=0,running=false,ended=false;
  const q=id=>el.querySelector('#'+id);
  function menu(){
    el.innerHTML=`<div class="game-header"><h2>🔨 モグラたたきラッシュ</h2><p>30秒でモグラをたたこう！💣はたたかないで</p></div>
      <div class="result-box"><div class="mole-legend"><span>🐹 20点</span><span>👑 60点＋1.5秒</span><span>💣 −40点</span></div>
      <p>連続ヒットでコンボ倍率アップ（5コンボ×1.5、10コンボでフィーバー×2）。<br>350点以上で勝利です。</p>
      <button class="btn mt" id="mole-start">スタート</button></div>`;
    q('mole-start').onclick=start;
  }
  function start(){
    score=0;combo=0;bestCombo=0;timeLeft=DURATION;running=true;ended=false;
    holes=Array.from({length:9},()=>({type:null,until:0,hit:false}));
    el.innerHTML=`<div class="game-header"><h2>🔨 モグラたたきラッシュ</h2><p id="mole-status">モグラが出たらすぐタップ！</p></div>
      <div class="info-row">
        <div class="info-box"><div class="ib-val" id="mole-score">0</div><div class="ib-label">スコア</div></div>
        <div class="info-box"><div class="ib-val" id="mole-time">30.0</div><div class="ib-label">残り秒</div></div>
        <div class="info-box"><div class="ib-val" id="mole-combo">0</div><div class="ib-label">コンボ</div></div>
      </div>
      <div class="quiz-progress"><div class="quiz-bar" id="mole-bar" style="width:100%"></div></div>
      <div class="mole-grid" id="mole-grid" aria-label="モグラの穴"></div>
      <p class="meta-sub center">穴をタップ／キーボードの1〜9でたたけます</p>`;
    const grid=q('mole-grid');
    holes.forEach((_,i)=>{
      const b=document.createElement('button');b.type='button';b.className='mole-hole';b.setAttribute('aria-label',`穴${i+1}`);
      b.innerHTML=`<span class="mole-key-hint">${i+1}</span><span class="mole-face"></span>`;
      b.addEventListener('pointerdown',e=>{e.preventDefault();whack(i);});
      // Enter/Space on a focused hole (a click with no pointer) also whacks it.
      b.addEventListener('click',e=>{if(e.detail===0)whack(i);});
      grid.appendChild(b);
    });
    endAt=performance.now()+DURATION;
    gameDelay(spawn,500);tick();
  }
  const multiplier=()=>combo>=10?2:combo>=5?1.5:1;
  const progress=()=>Math.min(1,Math.max(0,1-timeLeft/DURATION));
  function spawn(){
    if(!running)return;
    const free=holes.map((h,i)=>h.type?-1:i).filter(i=>i>=0);
    const count=progress()>.55&&Math.random()<.35?2:1;
    for(let n=0;n<count&&free.length;n++){
      const i=free.splice(Math.floor(Math.random()*free.length),1)[0],r=Math.random();
      const type=r<.1?'gold':r<.1+.13+progress()*.1?'bomb':'mole';
      const stay=type==='gold'?620:type==='bomb'?1100:950-progress()*380;
      holes[i]={type,until:performance.now()+stay,hit:false};paint(i);
    }
    gameDelay(spawn,Math.max(320,720-progress()*400)*(.75+Math.random()*.5));
  }
  function tick(){
    if(!running)return;
    const now=performance.now();timeLeft=endAt-now;
    holes.forEach((h,i)=>{
      if(!h.type||now<h.until)return;
      if(!h.hit&&h.type!=='bomb'&&combo>0){combo=0;setStatus('見逃した！コンボが途切れました');}
      holes[i]={type:null,until:0,hit:false};paint(i);
    });
    if(timeLeft<=0){finish();return;}
    updateInfo();gameDelay(tick,50);
  }
  function whack(i){
    const h=holes[i];if(!running||!h.type||h.hit)return;
    h.hit=true;h.until=performance.now()+220;
    if(h.type==='bomb'){score=Math.max(0,score-40);combo=0;playSfx('warn');paint(i,'−40',true);setStatus('💣 ドカン！ −40点');}
    else{
      combo++;bestCombo=Math.max(bestCombo,combo);
      const gain=Math.round((h.type==='gold'?60:20)*multiplier());score+=gain;
      if(h.type==='gold'){endAt+=1500;timeLeft+=1500;playSfx('combo');setStatus('👑 黄金モグラ！ 残り時間+1.5秒');}
      else{playSfx('pop');if(combo===10)setStatus('🔥 フィーバー！ 得点2倍');}
      paint(i,'+'+gain);
    }
    updateInfo();
  }
  function paint(i,pop='',bad=false){
    const b=q('mole-grid')?.children[i];if(!b)return;const h=holes[i];
    b.classList.toggle('up',!!h.type&&!h.hit);b.classList.toggle('hit',!!h.type&&h.hit);b.classList.toggle('bomb',h.type==='bomb');
    b.querySelector('.mole-face').innerHTML=h.type==='bomb'?'💣':h.type==='gold'?'🐹<span class="mole-crown">👑</span>':h.type?'🐹':'';
    if(pop){const p=document.createElement('span');p.className='mole-pop'+(bad?' bad':'');p.textContent=pop;b.appendChild(p);gameDelay(()=>p.remove(),500);}
  }
  function updateInfo(){
    if(!q('mole-score'))return;
    q('mole-score').textContent=score;q('mole-time').textContent=Math.max(0,timeLeft/1000).toFixed(1);
    q('mole-combo').textContent=combo+(multiplier()>1?` ×${multiplier()}`:'');
    q('mole-bar').style.width=Math.max(0,Math.min(100,timeLeft/DURATION*100))+'%';
    const fever=combo>=10;q('mole-grid').querySelectorAll('.mole-hole').forEach(b=>b.classList.toggle('fever',fever));
  }
  function setStatus(text){const s=q('mole-status');if(s)s.textContent=text;}
  function finish(){
    running=false;ended=true;timeLeft=0;
    holes=holes.map(()=>({type:null,until:0,hit:false}));holes.forEach((_,i)=>paint(i));updateInfo();
    setStatus(`タイムアップ！ 最大${bestCombo}コンボ`);
    el.insertAdjacentHTML('beforeend',`<div class="result-box"><div class="result-score">${score}</div><p>${score>=WIN_SCORE?'🎉 目標達成！':'あと'+(WIN_SCORE-score)+'点で勝利'}・最大${bestCombo}コンボ</p><button class="btn mt" onclick="startGame('whackamole')">もう一度</button></div>`);
    if(score>=WIN_SCORE)recordWin('whackamole',score);else{addScore(score,'whackamole');recordLoss(score,'whackamole');}
  }
  function onKey(e){
    if(e.target.closest?.('input,textarea')||e.repeat)return;
    const i=KEYS.indexOf(e.key);if(i>=0&&running){e.preventDefault();whack(i);}
  }
  document.addEventListener('keydown',onKey);
  menu();
  el._cleanup=()=>{running=false;ended=true;document.removeEventListener('keydown',onKey);};
};
