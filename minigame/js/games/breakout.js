
// ================================================================
// GAME 10: BREAKOUT (ブロック崩し)
// ================================================================
let breakoutInterval = null;
games.breakout = function(el) {
  const W=400, H=480, ROWS=5, COLS=8, BW=42, BH=16, BPX=6, BPY=8;
  let canvas, ctx, px, py, vx, vy, padX, padW=70, ball=8, score=0, lives=3, lvl=1, running=false, bricks=[];
  const COLORS=['#ff6b6b','#ffa94d','#ffd93d','#6bcb77','#4d96ff'];
  function initBricks() {
    bricks=[];
    for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) {
      bricks.push({x:BPX+c*(BW+4), y:50+r*(BH+6), alive:true, color:COLORS[r%COLORS.length], pts:(ROWS-r)*10*lvl});
    }
  }
  function reset(full) {
    if(full){score=0;lives=3;lvl=1;padW=70;}
    px=W/2; py=H-60; vx=(2+lvl*0.3)*(Math.random()<0.5?1:-1); vy=-(2.5+lvl*0.3);
    padX=W/2-padW/2; running=false;
    initBricks();
  }
  el.innerHTML=`
    <div class="game-header"><h2>🏓 ブロック崩し</h2><p>タップ・クリックでスタート / ドラッグ・マウスでパドル操作</p><p class="kbd-hint"><kbd>←</kbd><kbd>→</kbd>／<kbd>A</kbd><kbd>D</kbd> で移動、<kbd>Space</kbd> でスタート</p></div>
    <canvas id="bo-canvas" width="${W}" height="${H}" style="display:block;margin:0 auto;border-radius:18px;cursor:none;background:#0a0c1f;width:100%;max-width:420px;height:auto;touch-action:none"></canvas>
    <div id="bo-info" style="text-align:center;margin-top:10px;font-size:14px;color:var(--text2)"></div>`;
  canvas=document.getElementById('bo-canvas');
  ctx=canvas.getContext('2d');
  reset(true);
  const trail=[];
  function shade(hex,amt){const n=parseInt(hex.slice(1),16),c=[n>>16,(n>>8)&255,n&255].map(v=>Math.max(0,Math.min(255,Math.round(v+amt))));return `rgb(${c.join(',')})`;}
  function hudPill(text,x,align,color){ctx.font='900 13px sans-serif';const tw=ctx.measureText(text).width,left=align==='right'?x-tw-16:align==='center'?x-(tw+16)/2:x;ctx.fillStyle='rgba(10,10,30,.6)';ctx.beginPath();ctx.roundRect(left,8,tw+16,22,11);ctx.fill();ctx.fillStyle=color;ctx.textAlign='left';ctx.fillText(text,left+8,24);}
  function draw() {
    const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#141a3f');bg.addColorStop(1,'#0a0c1f');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='rgba(120,140,255,.07)';ctx.lineWidth=1;for(let x=0;x<=W;x+=25){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}for(let y=0;y<=H;y+=25){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    // bricks with bevel and shine
    bricks.forEach(b=>{
      if(!b.alive)return;
      const g=ctx.createLinearGradient(0,b.y,0,b.y+BH);g.addColorStop(0,shade(b.color,40));g.addColorStop(1,shade(b.color,-35));
      ctx.fillStyle=g;ctx.beginPath();ctx.roundRect(b.x,b.y,BW,BH,5);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.35)';ctx.beginPath();ctx.roundRect(b.x+3,b.y+2,BW-6,4,2);ctx.fill();
      ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(b.x+3,b.y+BH-3,BW-6,2);
    });
    // paddle
    ctx.shadowColor='rgba(199,125,255,.8)';ctx.shadowBlur=14;
    const pg=ctx.createLinearGradient(0,H-30,0,H-18);pg.addColorStop(0,'#e7c6ff');pg.addColorStop(1,'#9b4dff');
    ctx.fillStyle=pg;ctx.beginPath();ctx.roundRect(padX,H-30,padW,12,6);ctx.fill();ctx.shadowBlur=0;
    ctx.fillStyle='#ffd24d';ctx.fillRect(padX+6,H-26,5,4);ctx.fillRect(padX+padW-11,H-26,5,4);
    // ball with trail
    if(running){trail.push([px,py]);if(trail.length>7)trail.shift();}else trail.length=0;
    trail.forEach(([tx,ty],i)=>{ctx.fillStyle=`rgba(255,217,61,${(i+1)/trail.length*.25})`;ctx.beginPath();ctx.arc(tx,ty,ball*(i+1)/trail.length,0,Math.PI*2);ctx.fill();});
    ctx.shadowColor='rgba(255,217,61,.9)';ctx.shadowBlur=16;
    const bg2=ctx.createRadialGradient(px-3,py-3,1,px,py,ball);bg2.addColorStop(0,'#ffffff');bg2.addColorStop(.4,'#ffe27a');bg2.addColorStop(1,'#f2a922');
    ctx.fillStyle=bg2;ctx.beginPath();ctx.arc(px,py,ball,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    // HUD
    hudPill(`SCORE ${score}`,8,'left','#fff');hudPill(`Lv.${lvl}`,W/2,'center','#ffe28a');hudPill('❤️'.repeat(lives)||'—',W-8,'right','#fff');
    if(!running){ctx.fillStyle='rgba(5,5,20,.45)';ctx.fillRect(0,0,W,H);ctx.fillStyle='rgba(25,20,55,.9)';ctx.beginPath();ctx.roundRect(W/2-140,H/2-36,280,72,18);ctx.fill();ctx.fillStyle='#ffe28a';ctx.font='900 21px sans-serif';ctx.textAlign='center';ctx.fillText('タップでスタート',W/2,H/2-4);ctx.fillStyle='rgba(255,255,255,.7)';ctx.font='12px sans-serif';ctx.fillText('ドラッグ / マウス / ←→ でパドルを動かそう',W/2,H/2+20);}
  }
  const held=heldKeys({left:['ArrowLeft','a'],right:['ArrowRight','d']},{when:()=>lives>0});
  function steer(){const dir=(held.right?1:0)-(held.left?1:0);if(!dir)return;padX=Math.max(0,Math.min(W-padW,padX+dir*7));if(!running)draw();}
  function tick() {
    steer();
    if(!running)return;
    px+=vx; py+=vy;
    // walls
    if(px-ball<0){px=ball;vx=Math.abs(vx);}
    if(px+ball>W){px=W-ball;vx=-Math.abs(vx);}
    if(py-ball<0){py=ball;vy=Math.abs(vy);}
    // paddle
    if(py+ball>=H-30&&py+ball<=H-18&&px>=padX-ball&&px<=padX+padW+ball){
      vy=-Math.abs(vy); vx+=((px-(padX+padW/2))/(padW/2))*1.5;
      vx=Math.max(-5,Math.min(5,vx));
    }
    // bottom
    if(py+ball>H){
      lives--; running=false;
      if(lives<=0){endGame();return;}
      else{px=W/2;py=H-60;vx=(2+lvl*0.3)*(Math.random()<0.5?1:-1);vy=-(2.5+lvl*0.3);}
    }
    // bricks
    bricks.forEach(b=>{
      if(!b.alive)return;
      if(px+ball>b.x&&px-ball<b.x+BW&&py+ball>b.y&&py-ball<b.y+BH){
        b.alive=false; score+=b.pts;
        const midX=b.x+BW/2, midY=b.y+BH/2;
        const overlapX=Math.min(px+ball-b.x,b.x+BW-(px-ball));
        const overlapY=Math.min(py+ball-b.y,b.y+BH-(py-ball));
        if(overlapX<overlapY)vx=-vx; else vy=-vy;
      }
    });
    // all clear
    if(bricks.every(b=>!b.alive)){
      lvl++; padW=Math.max(40,padW-5);
      initBricks(); px=W/2; py=H-60;
      vx=(2+lvl*0.3)*(Math.random()<0.5?1:-1); vy=-(2.5+lvl*0.3);
      running=false;
      showToast(`🏓 LEVEL ${lvl}！`, '#4d96ff');
    }
    draw();
  }
  function endGame(){
    clearInterval(breakoutInterval);
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#ff6b6b';ctx.font='bold 28px sans-serif';ctx.textAlign='center';ctx.fillText('GAME OVER',W/2,H/2-20);
    ctx.fillStyle='#ffd93d';ctx.font='bold 18px sans-serif';ctx.fillText('SCORE: '+score,W/2,H/2+14);
    if(score>0)recordWin('breakout',score);else recordLoss(0,'breakout');
    const r=document.createElement('div');r.className='result-box';r.style.marginTop='12px';
    r.innerHTML=`<div class="result-score">${score}</div><p>Lv.${lvl}まで到達！</p>${xpResultHtml(score,'breakout')}<button class="btn mt" onclick="startGame('breakout')">もう一度</button>`;
    el.appendChild(r);
  }
  canvas.addEventListener('mousemove',e=>{
    const rect=canvas.getBoundingClientRect();
    const scaleX=W/rect.width;
    padX=Math.max(0,Math.min(W-padW,(e.clientX-rect.left)*scaleX-padW/2));
    draw();
  });
  canvas.addEventListener('touchmove',e=>{
    e.preventDefault();
    const rect=canvas.getBoundingClientRect();
    const scaleX=W/rect.width;
    padX=Math.max(0,Math.min(W-padW,(e.touches[0].clientX-rect.left)*scaleX-padW/2));
  },{passive:false});
  canvas.addEventListener('click',()=>{running=true;});
  onGameKey(key=>{if(key!==' '&&key!=='Enter')return false;if(lives>0)running=true;return true;});
  breakoutInterval=setInterval(tick,16);
  draw();
};
