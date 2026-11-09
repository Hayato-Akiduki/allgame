
// GAME 22: SIMON
games.simon = function(el) {
  const colors=['#ff5d6c','#4d96ff','#ffd93d','#6bcb77'];
  const names=['赤','青','黄','緑'];
  const tones=[261.63,329.63,392.00,523.25];
  let sequence=[],inputIndex=0,round=0,score=0,locked=true,ended=false,audioCtx=null;

  el.innerHTML=`
    <div class="game-header"><h2>🎵 サイモンゲーム</h2><p id="simon-status">光った順番を覚えて再現しよう</p></div>
    <div class="info-row">
      <div class="info-box"><div class="ib-val" id="simon-round">0 / 12</div><div class="ib-label">ラウンド</div></div>
      <div class="info-box"><div class="ib-val" id="simon-score">0</div><div class="ib-label">スコア</div></div>
    </div>
    <div class="simon-board" id="simon-board">
      ${colors.map((color,i)=>`<button class="simon-pad" data-pad="${i}" style="background:${color};--pad-color:${color}" aria-label="${names[i]}、キー${i+1}"></button>`).join('')}
    </div>
    <div class="center"><button class="btn btn-success" id="simon-start">スタート</button></div>
    <div id="simon-result"></div>`;

  const pads=[...el.querySelectorAll('.simon-pad')];
  const status=el.querySelector('#simon-status');
  const startBtn=el.querySelector('#simon-start');
  const updateHud=()=>{
    el.querySelector('#simon-round').textContent=`${round} / 12`;
    el.querySelector('#simon-score').textContent=score.toLocaleString();
  };
  function tone(i,duration=180){
    try{
      audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();
      const osc=audioCtx.createOscillator(),gain=audioCtx.createGain(),now=audioCtx.currentTime;
      osc.frequency.value=tones[i];osc.type='sine';gain.gain.setValueAtTime(Math.max(.0001,.4*sound.volume),now);gain.gain.exponentialRampToValueAtTime(.001,now+duration/1000);
      osc.connect(gain);gain.connect(audioCtx.destination);osc.start(now);osc.stop(now+duration/1000);
    }catch(e){}
  }
  function flash(i,duration=300){
    const pad=pads[i];pad.classList.add('active');tone(i,duration);
    gameDelay(()=>pad.classList.remove('active'),duration);
  }
  function playSequence(index=0){
    if(ended)return;
    locked=true;pads.forEach(p=>p.disabled=true);
    if(index===0)status.textContent=`ラウンド ${round}：よく見て…`;
    if(index>=sequence.length){
      gameDelay(()=>{locked=false;inputIndex=0;pads.forEach(p=>p.disabled=false);status.textContent='あなたの番！';},350);
      return;
    }
    flash(sequence[index],Math.max(190,340-round*9));
    gameDelay(()=>playSequence(index+1),Math.max(360,610-round*14));
  }
  function nextRound(){
    round++;sequence.push(Math.floor(Math.random()*4));updateHud();
    gameDelay(()=>playSequence(),550);
  }
  function finish(won){
    if(ended)return;ended=true;locked=true;pads.forEach(p=>p.disabled=true);
    if(won)recordWin('simon',score);else recordLoss(score,'simon');
    status.textContent=won?'全ラウンドクリア！':'順番が違います';
    el.querySelector('#simon-result').innerHTML=`
      <div class="result-box mt"><div class="result-score">${score.toLocaleString()}</div>
      <p>${won?'🎉 完全クリア！':'ラウンド '+round+'まで到達！'}</p>
      ${won?xpResultHtml(score,'simon'):'<div class="meta-sub">もう一度挑戦して記録を伸ばそう</div>'}
      <button class="btn btn-warn mt" onclick="startGame('simon')">もう一度</button></div>`;
  }
  function press(i){
    if(locked||ended)return;
    flash(i,150);
    if(i!==sequence[inputIndex]){pads[i].style.animation='shake .25s';gameDelay(()=>pads[i].style.animation='',260);finish(false);return;}
    inputIndex++;score+=10;updateHud();
    if(inputIndex===sequence.length){
      locked=true;pads.forEach(p=>p.disabled=true);score+=round*5;updateHud();
      if(round>=12)gameDelay(()=>finish(true),450);
      else {status.textContent='正解！';gameDelay(nextRound,700);}
    }
  }
  pads.forEach((pad,i)=>pad.addEventListener('click',()=>press(i)));
  const keyHandler=e=>{const i=['1','2','3','4'].indexOf(e.key);if(i>=0)press(i);};
  document.addEventListener('keydown',keyHandler);
  startBtn.addEventListener('click',()=>{
    startBtn.style.display='none';sequence=[];round=0;score=0;ended=false;updateHud();nextRound();
  });
  el._cleanup=()=>{ended=true;document.removeEventListener('keydown',keyHandler);if(audioCtx)audioCtx.close().catch(()=>{});};
};
