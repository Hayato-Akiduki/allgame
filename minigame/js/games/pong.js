
// GAME 27: PONG
games.pong = function(el) {
  const MODES={easy:{name:'かんたん',ai:170,ball:270,bonus:300,color:'#6bcb77'},normal:{name:'ふつう',ai:235,ball:315,bonus:600,color:'#4d96ff'},hard:{name:'むずかしい',ai:310,ball:360,bonus:1000,color:'#ff6b6b'}};
  let mode=null,canvas=null,ctx=null,raf=0,running=false,ended=false,lastTime=0,keys={},playerY=160,cpuY=160,playerPoints=0,cpuPoints=0,score=0,rally=0,maxRally=0;
  const W=640,H=400,PW=13,PH=82,PX=24,CX=W-24-PW;
  let ball={x:W/2,y:H/2,vx:0,vy:0,r:8,ready:true};

  function menu(){
    el.innerHTML=`<div class="game-header"><h2>🏓 Pong</h2><p>CPUより先に7点取ろう！</p></div>
      <div class="result-box"><h3>CPUの強さ</h3><div class="flex-center mt">
      ${Object.entries(MODES).map(([id,m])=>`<button class="btn" data-pong-mode="${id}" style="background:${m.color}">${m.name}</button>`).join('')}
      </div><div class="meta-sub mt">難しいほどCPUの移動とボールが速くなります。<br>W／S・↑／↓、またはキャンバス上でマウスや指を動かして操作します。</div></div>`;
    el.querySelectorAll('[data-pong-mode]').forEach(b=>b.addEventListener('click',()=>start(b.dataset.pongMode)));
  }
  function start(id){
    mode=MODES[id];running=true;ended=false;playerY=cpuY=(H-PH)/2;playerPoints=cpuPoints=score=rally=maxRally=0;keys={};
    el.innerHTML=`<div class="game-header"><h2>🏓 Pong</h2><p>難易度：${mode.name}</p><p id="pong-status">${mode.name}CPUと対戦中</p></div>
      <div class="info-row">
        <div class="info-box"><div class="ib-val" id="pong-player">0</div><div class="ib-label">あなた</div></div>
        <div class="info-box"><div class="ib-val" id="pong-rally">0</div><div class="ib-label">ラリー</div></div>
        <div class="info-box"><div class="ib-val" id="pong-cpu">0</div><div class="ib-label">CPU</div></div>
        <div class="info-box"><div class="ib-val" id="pong-score">0</div><div class="ib-label">スコア</div></div>
      </div>
      <canvas id="pong-canvas" width="640" height="400" aria-label="Pongゲーム画面"></canvas>
      <div class="meta-sub center">操作：W／S・↑／↓・マウス・タッチ</div><div class="center mt"><button class="btn btn-sm" onclick="startGame('pong')">難易度選択へ</button></div><div id="pong-result"></div>`;
    canvas=el.querySelector('#pong-canvas');ctx=canvas.getContext('2d');
    canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerdown',pointerMove);
    document.addEventListener('keydown',keyDown);document.addEventListener('keyup',keyUp);
    resetBall(Math.random()<.5?-1:1);lastTime=performance.now();raf=requestAnimationFrame(loop);
  }
  function pointerMove(e){
    if(!running)return;const rect=canvas.getBoundingClientRect();playerY=(e.clientY-rect.top)*H/rect.height-PH/2;playerY=Math.max(0,Math.min(H-PH,playerY));
  }
  function keyDown(e){if(['ArrowUp','ArrowDown','w','W','s','S'].includes(e.key)){e.preventDefault();keys[e.key.toLowerCase()]=true;}}
  function keyUp(e){keys[e.key.toLowerCase()]=false;}
  function resetBall(direction){
    ball={x:W/2,y:H/2,vx:0,vy:0,r:8,ready:true};rally=0;updateHud();
    gameDelay(()=>{
      if(!running||ended)return;const angle=(Math.random()*.9-.45);ball.vx=Math.cos(angle)*mode.ball*direction;ball.vy=Math.sin(angle)*mode.ball;ball.ready=false;
    },700);
  }
  function updateHud(){
    const ids={player:playerPoints,cpu:cpuPoints,rally,score};Object.entries(ids).forEach(([id,value])=>{const node=el.querySelector(`#pong-${id}`);if(node)node.textContent=value.toLocaleString();});
  }
  function loop(now){
    if(!running)return;const dt=Math.min(.025,(now-lastTime)/1000||0);lastTime=now;update(dt);draw();raf=requestAnimationFrame(loop);
  }
  function update(dt){
    const dir=(keys['arrowdown']||keys.s?1:0)-(keys['arrowup']||keys.w?1:0);playerY=Math.max(0,Math.min(H-PH,playerY+dir*330*dt));
    const target=ball.ready?H/2:ball.y,cpuCenter=cpuY+PH/2,diff=target-cpuCenter,step=Math.sign(diff)*Math.min(Math.abs(diff),mode.ai*dt);cpuY=Math.max(0,Math.min(H-PH,cpuY+step));
    if(ball.ready)return;ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;
    if(ball.y-ball.r<=0){ball.y=ball.r;ball.vy=Math.abs(ball.vy);}else if(ball.y+ball.r>=H){ball.y=H-ball.r;ball.vy=-Math.abs(ball.vy);}
    if(ball.vx<0&&ball.x-ball.r<=PX+PW&&ball.x>PX&&ball.y+ball.r>=playerY&&ball.y-ball.r<=playerY+PH){
      ball.x=PX+PW+ball.r;const hit=(ball.y-(playerY+PH/2))/(PH/2);ball.vx=Math.abs(ball.vx)*1.035;ball.vy=hit*mode.ball*.9;rally++;maxRally=Math.max(maxRally,rally);score+=10+rally*2;updateHud();
    }
    if(ball.vx>0&&ball.x+ball.r>=CX&&ball.x<CX+PW&&ball.y+ball.r>=cpuY&&ball.y-ball.r<=cpuY+PH){
      ball.x=CX-ball.r;const hit=(ball.y-(cpuY+PH/2))/(PH/2);ball.vx=-Math.abs(ball.vx)*1.025;ball.vy=hit*mode.ball*.9;rally++;maxRally=Math.max(maxRally,rally);updateHud();
    }
    if(ball.x<-20)point(false);else if(ball.x>W+20)point(true);
  }
  function point(playerWon){
    if(playerWon){playerPoints++;score+=100;el.querySelector('#pong-status').textContent='ナイスショット！';}
    else {cpuPoints++;el.querySelector('#pong-status').textContent='CPUの得点';}
    updateHud();if(playerPoints>=7||cpuPoints>=7){finish(playerPoints>=7);return;}resetBall(playerWon?-1:1);
  }
  const pongTrail=[];
  function draw(){
    const bg=ctx.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#0d1630');bg.addColorStop(1,'#1a0f33');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='rgba(120,170,255,.25)';ctx.lineWidth=3;ctx.strokeRect(8,8,W-16,H-16);
    ctx.strokeStyle='rgba(255,255,255,.18)';ctx.setLineDash([10,12]);ctx.beginPath();ctx.moveTo(W/2,8);ctx.lineTo(W/2,H-8);ctx.stroke();ctx.setLineDash([]);
    ctx.beginPath();ctx.arc(W/2,H/2,56,0,Math.PI*2);ctx.stroke();
    ctx.font='900 64px sans-serif';ctx.textAlign='center';ctx.fillStyle='rgba(120,170,255,.16)';ctx.fillText(playerPoints,W*.36,82);ctx.fillStyle='rgba(255,120,140,.16)';ctx.fillText(cpuPoints,W*.64,82);
    const paddle=(x,y,c1,c2,glow)=>{ctx.shadowColor=glow;ctx.shadowBlur=18;const g=ctx.createLinearGradient(x,0,x+PW,0);g.addColorStop(0,c1);g.addColorStop(1,c2);ctx.fillStyle=g;ctx.beginPath();ctx.roundRect(x,y,PW,PH,7);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='rgba(255,255,255,.45)';ctx.fillRect(x+3,y+6,3,PH-12);};
    paddle(PX,playerY,'#8fc0ff','#2f6fe0','rgba(77,150,255,.9)');paddle(CX,cpuY,'#ffb0b0','#e03a4a','rgba(255,107,107,.9)');
    if(!ball.ready){pongTrail.push([ball.x,ball.y]);if(pongTrail.length>8)pongTrail.shift();}else pongTrail.length=0;
    pongTrail.forEach(([x,y],i)=>{ctx.fillStyle=`rgba(255,255,255,${(i+1)/pongTrail.length*.22})`;ctx.beginPath();ctx.arc(x,y,ball.r*(i+1)/pongTrail.length,0,Math.PI*2);ctx.fill();});
    ctx.fillStyle='#fff';ctx.shadowColor='#bfe3ff';ctx.shadowBlur=18;ctx.beginPath();ctx.arc(ball.x,ball.y,ball.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  }
  function finish(won){
    if(ended)return;ended=true;running=false;cancelAnimationFrame(raf);const finalScore=score+(won?mode.bonus:0);
    if(won)recordWin('pong',finalScore);else recordLoss(finalScore,'pong');
    el.querySelector('#pong-status').textContent=won?'7点先取！勝利！':'CPUの勝利';
    el.querySelector('#pong-result').innerHTML=`<div class="result-box mt"><div class="result-score">${playerPoints} - ${cpuPoints}</div><p>${won?'🎉 勝利！':'惜しい！もう一度挑戦しよう'}</p>
      <div class="info-row mt"><div class="info-box"><div class="ib-val">${finalScore.toLocaleString()}</div><div class="ib-label">スコア</div></div><div class="info-box"><div class="ib-val">${maxRally}</div><div class="ib-label">最大ラリー</div></div></div>
      ${won?xpResultHtml(finalScore,'pong'):''}<button class="btn btn-warn mt" onclick="startGame('pong')">もう一度</button></div>`;
  }
  menu();
  el._cleanup=()=>{running=false;ended=true;cancelAnimationFrame(raf);document.removeEventListener('keydown',keyDown);document.removeEventListener('keyup',keyUp);};
};
