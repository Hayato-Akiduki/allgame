
// GAME: FRUIT MERGE (drop-and-merge physics puzzle)
const FRUIT_TYPES=[
  {e:'🍒',r:13,c:'#e84a5f'},{e:'🍓',r:17,c:'#ff6b81'},{e:'🍇',r:22,c:'#9b5de5'},{e:'🍊',r:27,c:'#ffa94d'},
  {e:'🍋',r:32,c:'#ffd43b'},{e:'🍎',r:38,c:'#e03131'},{e:'🍐',r:44,c:'#a9e34b'},{e:'🍑',r:50,c:'#ffa8a8'},
  {e:'🍍',r:57,c:'#fcc419'},{e:'🍈',r:64,c:'#8ce99a'},{e:'🍉',r:72,c:'#40c057'}
];
games.fruitmerge=function(el){
  const W=360,H=480,WALL=8,FLOOR=H-10,DANGER_Y=78,DROP_Y=42,GRAVITY=1100,STEP=1/120,WIN_SCORE=300,WATERMELON=FRUIT_TYPES.length-1;
  let fruits=[],current=0,next=0,dropX=W/2,canDrop=true,score=0,maxLevel=0,danger=0,ended=false,raf=0,last=0,acc=0,nextId=1;
  el.innerHTML=`<div class="game-header"><h2>🍉 フルーツマージ</h2><p id="fm-status">同じフルーツをくっつけて大きくしよう！</p></div>
    <div class="info-row">
      <div class="info-box"><div class="ib-val" id="fm-score">0</div><div class="ib-label">スコア</div></div>
      <div class="info-box"><div class="ib-val" id="fm-next">🍒</div><div class="ib-label">次</div></div>
      <div class="info-box"><div class="ib-val" id="fm-max">🍒</div><div class="ib-label">最大</div></div>
    </div>
    <canvas id="fm-canvas" width="${W}" height="${H}" class="fm-canvas" aria-label="フルーツマージの箱。左右に動かして離すとフルーツが落ちます。"></canvas>
    <div class="flex-center mt"><button class="btn btn-warn" id="fm-finish">💰 精算して終了</button><button class="btn btn-sm" id="fm-reset">最初から</button></div>
    <p class="meta-sub center mt">ドラッグして離す／クリックで落とす・←→で移動、Spaceで落とす。300点以上かスイカ完成で勝利！</p>`;
  const q=id=>el.querySelector('#'+id),canvas=q('fm-canvas'),ctx=canvas.getContext('2d');
  const randomDrop=()=>{const r=Math.random();return r<.3?0:r<.55?1:r<.78?2:r<.93?3:4;};
  current=randomDrop();next=randomDrop();
  function clampX(x,level){const r=FRUIT_TYPES[level].r;return Math.max(WALL+r,Math.min(W-WALL-r,x));}
  function drop(){
    if(!canDrop||ended)return;
    fruits.push({id:nextId++,x:clampX(dropX,current),y:DROP_Y,vx:0,vy:0,lvl:current,born:performance.now()});
    current=next;next=randomDrop();canDrop=false;playSfx('click');updateInfo();
    gameDelay(()=>{canDrop=true;},450);
  }
  function addFruitScore(level){score+=level*(level+1)/2;if(level>maxLevel)maxLevel=level;}
  function step(){
    for(const f of fruits){
      const r=FRUIT_TYPES[f.lvl].r;
      f.vy+=GRAVITY*STEP;f.vx*=.999;f.x+=f.vx*STEP;f.y+=f.vy*STEP;
      if(f.x-r<WALL){f.x=WALL+r;f.vx=Math.abs(f.vx)*.2;}
      if(f.x+r>W-WALL){f.x=W-WALL-r;f.vx=-Math.abs(f.vx)*.2;}
      if(f.y+r>FLOOR){f.y=FLOOR-r;f.vy=-Math.abs(f.vy)*.15;f.vx*=.9;}
    }
    const removed=new Set(),born=[];
    for(let pass=0;pass<3;pass++){
      for(let i=0;i<fruits.length;i++){
        const a=fruits[i];if(removed.has(a.id))continue;const ra=FRUIT_TYPES[a.lvl].r;
        for(let j=i+1;j<fruits.length;j++){
          const b=fruits[j];if(removed.has(b.id))continue;const rb=FRUIT_TYPES[b.lvl].r;
          let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);const min=ra+rb;
          if(d>=min)continue;
          if(a.lvl===b.lvl&&pass===0){
            removed.add(a.id);removed.add(b.id);
            if(a.lvl<WATERMELON){
              const lvl=a.lvl+1;born.push({id:nextId++,x:(a.x+b.x)/2,y:(a.y+b.y)/2,vx:(a.vx+b.vx)/2,vy:Math.min(a.vy,b.vy)/2,lvl,born:performance.now()-2000});
              addFruitScore(lvl);playSfx(lvl===WATERMELON?'fanfare':'merge');
              if(lvl===WATERMELON)status('🍉 スイカ完成！');
            }else{score+=100;playSfx('fanfare');status('🍉🍉 スイカ同士が合体！ +100');}
            break;
          }
          if(d===0){dx=Math.random()-.5;dy=-1;d=Math.hypot(dx,dy);}
          const nx=dx/d,ny=dy/d,overlap=min-d,ma=ra*ra,mb=rb*rb,total=ma+mb;
          a.x-=nx*overlap*mb/total;a.y-=ny*overlap*mb/total;b.x+=nx*overlap*ma/total;b.y+=ny*overlap*ma/total;
          const vn=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
          if(vn<0){const imp=-1.1*vn/(1/ma+1/mb);a.vx-=imp/ma*nx;a.vy-=imp/ma*ny;b.vx+=imp/mb*nx;b.vy+=imp/mb*ny;}
        }
      }
    }
    if(removed.size)fruits=fruits.filter(f=>!removed.has(f.id)).concat(born);
    for(const f of fruits){const r=FRUIT_TYPES[f.lvl].r;if(f.y+r>FLOOR)f.y=FLOOR-r;}
  }
  function checkDanger(dt){
    const now=performance.now();
    const over=fruits.some(f=>now-f.born>1200&&f.y-FRUIT_TYPES[f.lvl].r<DANGER_Y);
    danger=over?danger+dt:Math.max(0,danger-dt*2);
    if(danger>2){status('箱からあふれました！');finish();}
  }
  function drawFruit(lvl,x,y,alpha=1){
    const f=FRUIT_TYPES[lvl];ctx.globalAlpha=alpha;
    ctx.fillStyle=f.c+'55';ctx.beginPath();ctx.arc(x,y,f.r,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=f.c;ctx.lineWidth=2;ctx.stroke();
    ctx.font=`${Math.round(f.r*1.45)}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(f.e,x,y+f.r*.06);ctx.globalAlpha=1;
  }
  function draw(){
    ctx.fillStyle='#fbefd5';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#c98b55';ctx.fillRect(0,0,WALL,H);ctx.fillRect(W-WALL,0,WALL,H);ctx.fillRect(0,FLOOR,W,H-FLOOR);
    ctx.strokeStyle=danger>0?`rgba(229,72,77,${.5+Math.min(.5,danger/2)})`:'rgba(229,72,77,.35)';ctx.setLineDash([8,6]);ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(WALL,DANGER_Y);ctx.lineTo(W-WALL,DANGER_Y);ctx.stroke();ctx.setLineDash([]);
    if(!ended){
      const x=clampX(dropX,current);
      ctx.strokeStyle='rgba(120,80,40,.25)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,DROP_Y);ctx.lineTo(x,FLOOR);ctx.stroke();
      if(canDrop)drawFruit(current,x,DROP_Y);
    }
    for(const f of fruits)drawFruit(f.lvl,f.x,f.y);
  }
  function frame(now){
    if(ended)return;
    const dt=last?Math.min((now-last)/1000,.05):0;last=now;acc+=dt;
    while(acc>=STEP){step();acc-=STEP;}
    checkDanger(dt);if(ended)return;
    draw();updateInfo();raf=requestAnimationFrame(frame);
  }
  function updateInfo(){q('fm-score').textContent=score.toLocaleString();q('fm-next').textContent=FRUIT_TYPES[next].e;q('fm-max').textContent=FRUIT_TYPES[maxLevel].e;}
  function status(text){q('fm-status').textContent=text;}
  function finish(){
    if(ended)return;ended=true;cancelAnimationFrame(raf);draw();updateInfo();
    const won=score>=WIN_SCORE||maxLevel>=WATERMELON;
    q('fm-finish').disabled=true;
    el.insertAdjacentHTML('beforeend',`<div class="result-box"><div class="result-score">${score.toLocaleString()}</div><p>最大 ${FRUIT_TYPES[maxLevel].e}${won?'・🎉 目標達成！':'・300点以上で勝利'}</p><button class="btn mt" onclick="startGame('fruitmerge')">もう一度</button></div>`);
    if(won)recordWin('fruitmerge',score);else{addScore(score,'fruitmerge');recordLoss(score,'fruitmerge');}
  }
  const toX=e=>{const r=canvas.getBoundingClientRect();return (e.clientX-r.left)*W/r.width;};
  canvas.onpointermove=e=>{dropX=toX(e);};
  canvas.onpointerdown=e=>{if(ended)return;e.preventDefault();dropX=toX(e);canvas.setPointerCapture?.(e.pointerId);};
  canvas.onpointerup=e=>{if(ended)return;dropX=toX(e);drop();};
  function onKey(e){
    if(ended||e.target.closest?.('input,textarea'))return;
    if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A'){dropX=clampX(dropX,current)-16;e.preventDefault();}
    else if(e.key==='ArrowRight'||e.key==='d'||e.key==='D'){dropX=clampX(dropX,current)+16;e.preventDefault();}
    else if(e.key===' '||e.key==='Enter'){if(!e.repeat)drop();e.preventDefault();}
  }
  document.addEventListener('keydown',onKey);
  q('fm-finish').onclick=()=>{status('精算しました');finish();};
  q('fm-reset').onclick=()=>startGame('fruitmerge');
  updateInfo();raf=requestAnimationFrame(frame);
  el._cleanup=()=>{ended=true;cancelAnimationFrame(raf);document.removeEventListener('keydown',onKey);};
};
