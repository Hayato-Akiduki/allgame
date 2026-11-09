
// ================================================================
// GAME: SNAKE
// ================================================================
games.snake = function(el) {
  const SIZE=20,CELL=20,W=SIZE*CELL;let canvas,ctx,timer,snake,food,dir,nextDir,score,running,started,touchStart;
  function placeFood(){do{food={x:Math.floor(Math.random()*SIZE),y:Math.floor(Math.random()*SIZE)};}while(snake.some(s=>s.x===food.x&&s.y===food.y));}
  function init(){snake=[{x:10,y:10},{x:9,y:10},{x:8,y:10}];dir={x:1,y:0};nextDir={...dir};score=0;running=true;started=false;placeFood();updateHud();draw();}
  function setDir(x,y){if(x===-dir.x&&y===-dir.y)return;nextDir={x,y};if(!started){started=true;restartTimer();}}
  function restartTimer(){clearInterval(timer);timer=setInterval(step,Math.max(55,125-Math.floor(score/50)*8));}
  function step(){
    if(!running||!started)return;dir=nextDir;const head={x:snake[0].x+dir.x,y:snake[0].y+dir.y};
    if(head.x<0||head.x>=SIZE||head.y<0||head.y>=SIZE||snake.some(s=>s.x===head.x&&s.y===head.y)){end();return;}
    snake.unshift(head);if(head.x===food.x&&head.y===food.y){score+=10;placeFood();updateHud();restartTimer();}else snake.pop();draw();
  }
  function updateHud(){const s=document.getElementById('snake-score'),l=document.getElementById('snake-length');if(s)s.textContent=score;if(l)l.textContent=snake.length;}
  function draw(){
    for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){ctx.fillStyle=(x+y)%2?'#4caf50':'#56b85a';ctx.fillRect(x*CELL,y*CELL,CELL,CELL);}
    // apple
    const fx=food.x*CELL+10,fy=food.y*CELL+11,pulse=1+Math.sin(Date.now()/180)*.06;
    ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.ellipse(fx,fy+7,7,2.5,0,0,Math.PI*2);ctx.fill();
    const ag=ctx.createRadialGradient(fx-3,fy-3,1,fx,fy,9*pulse);ag.addColorStop(0,'#ff9a8a');ag.addColorStop(1,'#d62828');ctx.fillStyle=ag;ctx.beginPath();ctx.arc(fx,fy,8*pulse,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#6b3e1f';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(fx,fy-7);ctx.lineTo(fx+1,fy-11);ctx.stroke();ctx.fillStyle='#7ed957';ctx.beginPath();ctx.ellipse(fx+4,fy-10,3.5,1.8,-.5,0,Math.PI*2);ctx.fill();
    // body as a smooth tube, darker toward the tail
    const n=snake.length;
    for(let i=n-1;i>=0;i--){
      const s=snake[i],t=i/Math.max(1,n-1),r=9-t*2.5,cx=s.x*CELL+10,cy=s.y*CELL+10;
      ctx.fillStyle=`hsl(${210-t*20},80%,${58-t*16}%)`;
      if(i<n-1){const p=snake[i+1];ctx.lineWidth=r*2;ctx.lineCap='round';ctx.strokeStyle=ctx.fillStyle;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(p.x*CELL+10,p.y*CELL+10);ctx.stroke();}
      ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
      if(i%2===1){ctx.fillStyle='rgba(255,255,255,.18)';ctx.beginPath();ctx.arc(cx,cy,r*.45,0,Math.PI*2);ctx.fill();}
    }
    // head
    const h=snake[0],hx=h.x*CELL+10,hy=h.y*CELL+10,d=started?nextDir:dir,px=-d.y,py=d.x;
    ctx.fillStyle='#4f8cff';ctx.beginPath();ctx.arc(hx,hy,10,0,Math.PI*2);ctx.fill();
    if(started&&Math.floor(Date.now()/250)%2===0){ctx.strokeStyle='#ff4d6d';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(hx+d.x*9,hy+d.y*9);ctx.lineTo(hx+d.x*15,hy+d.y*15);ctx.stroke();}
    for(const side of [-1,1]){const ex=hx+d.x*3+px*side*4.5,ey=hy+d.y*3+py*side*4.5;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(ex,ey,3.2,0,Math.PI*2);ctx.fill();ctx.fillStyle='#1b1b24';ctx.beginPath();ctx.arc(ex+d.x*1.2,ey+d.y*1.2,1.7,0,Math.PI*2);ctx.fill();}
    if(!started){ctx.fillStyle='rgba(10,30,15,.25)';ctx.fillRect(0,0,W,W);const py0=W*.78;ctx.fillStyle='rgba(20,40,25,.9)';ctx.beginPath();ctx.roundRect(W/2-150,py0-38,300,76,18);ctx.fill();ctx.fillStyle='#fff';ctx.font='900 20px sans-serif';ctx.textAlign='center';ctx.fillText('方向キー / スワイプでスタート',W/2,py0-4);ctx.fillStyle='rgba(255,255,255,.75)';ctx.font='12px sans-serif';ctx.fillText('🍎を食べて長くなろう',W/2,py0+20);}
  }
  function end(){running=false;clearInterval(timer);if(score>0)recordWin('snake',score);else recordLoss(0,'snake');document.getElementById('snake-result').innerHTML=`<div class="result-box"><div class="result-score">${score}</div><p>長さ ${snake.length} まで成長！</p><button class="btn mt" onclick="startGame('snake')">もう一度</button></div>`;}
  const key=e=>{if(e.ctrlKey||e.metaKey||e.altKey)return;const map={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]};const k=e.key.length===1?e.key.toLowerCase():e.key;if(map[k]&&!isTypingTarget(e.target)){e.preventDefault();setDir(...map[k]);}};
  el.innerHTML=`<div class="game-header"><h2>🐍 Snake</h2><p>エサを食べて成長。壁や自分の体にぶつかると終了！</p><p class="kbd-hint">矢印キー／<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> で方向転換（スマホはスワイプかボタン）</p></div><div class="info-row"><div class="info-box"><div class="ib-val" id="snake-score">0</div><div class="ib-label">スコア</div></div><div class="info-box"><div class="ib-val" id="snake-length">3</div><div class="ib-label">長さ</div></div></div><canvas id="snake-canvas" width="${W}" height="${W}" style="display:block;margin:auto;width:100%;max-width:440px;height:auto;border-radius:18px;touch-action:none;box-shadow:var(--shadow)"></canvas><div class="direction-pad"><span></span><button class="btn btn-sm" onclick="snakeDir(0,-1)" aria-label="上へ">▲</button><span></span><button class="btn btn-sm" onclick="snakeDir(-1,0)" aria-label="左へ">◀</button><button class="btn btn-sm" onclick="snakeDir(0,1)" aria-label="下へ">▼</button><button class="btn btn-sm" onclick="snakeDir(1,0)" aria-label="右へ">▶</button></div><div id="snake-result"></div>`;
  canvas=document.getElementById('snake-canvas');ctx=canvas.getContext('2d');window.snakeDir=setDir;document.addEventListener('keydown',key);
  canvas.addEventListener('touchstart',e=>{touchStart={x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:true});canvas.addEventListener('touchend',e=>{if(!touchStart)return;const dx=e.changedTouches[0].clientX-touchStart.x,dy=e.changedTouches[0].clientY-touchStart.y;if(Math.max(Math.abs(dx),Math.abs(dy))>18)Math.abs(dx)>Math.abs(dy)?setDir(Math.sign(dx),0):setDir(0,Math.sign(dy));touchStart=null;},{passive:true});
  init();el._cleanup=()=>{running=false;clearInterval(timer);document.removeEventListener('keydown',key);};
};
