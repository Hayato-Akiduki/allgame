

// ================================================================
// GAME 9: TETRIS
// ================================================================
const TETRIS_COLS=10, TETRIS_ROWS=20, CELL=28;
const PIECES=[
  {shape:[[1,1,1,1]],color:'#60c8ff'},
  {shape:[[1,0],[1,0],[1,1]],color:'#ffa94d'},
  {shape:[[0,1],[0,1],[1,1]],color:'#4d96ff'},
  {shape:[[1,1],[1,1]],color:'#ffd93d'},
  {shape:[[0,1,1],[1,1,0]],color:'#6bcb77'},
  {shape:[[1,1,0],[0,1,1]],color:'#ff6b6b'},
  {shape:[[0,1,0],[1,1,1]],color:'#c77dff'},
];
let tetrisInterval=null;
let tetrisKeyHandler=null;
// Beveled, glossy block shared by the tetris board and the next-piece preview.
function tetrisBlock(c,x,y,size,color){
  const s=size-2;x+=1;y+=1;c.fillStyle=color;c.fillRect(x,y,s,s);
  const g=c.createLinearGradient(x,y,x+s,y+s);g.addColorStop(0,'rgba(255,255,255,.38)');g.addColorStop(.5,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(0,0,0,.28)');c.fillStyle=g;c.fillRect(x,y,s,s);
  const b=Math.max(2,s*.14);c.fillStyle='rgba(255,255,255,.35)';c.fillRect(x,y,s,b);c.fillRect(x,y,b,s);c.fillStyle='rgba(0,0,0,.25)';c.fillRect(x,y+s-b,s,b);c.fillRect(x+s-b,y,b,s);
  c.fillStyle='rgba(255,255,255,.5)';c.fillRect(x+b+1,y+b+1,Math.max(2,s*.18),Math.max(2,s*.18));
}
games.tetris = function(el) {
  el.innerHTML=`
    <div class="game-header"><h2>🧱 テトリス</h2></div>
    <div id="tetris-wrap">
      <canvas id="tetris-canvas" width="${TETRIS_COLS*CELL}" height="${TETRIS_ROWS*CELL}" style="border: 4px solid var(--surface2); box-shadow: 0 8px 16px rgba(0,0,0,0.5); touch-action:none"></canvas>
      <div id="tetris-side">
        <div class="tetris-panel"><div class="tp-label">SCORE</div><div class="tp-val" id="tet-score">0</div></div>
        <div class="tetris-panel"><div class="tp-label">LINES</div><div class="tp-val" id="tet-lines">0</div></div>
        <div class="tetris-panel"><div class="tp-label">LEVEL</div><div class="tp-val" id="tet-lvl">1</div></div>
        <div class="tetris-panel"><div class="tp-label">NEXT</div><canvas id="next-canvas" width="80" height="80"></canvas></div>
        <div class="tetris-panel"><div class="tp-label">HOLD (C)</div><canvas id="hold-canvas" width="80" height="80"></canvas></div>
        <div class="tet-hint">← → 移動 / ↑ 回転<br>↓ 落下 / Space 即落下<br>C / Shift ホールド</div>
        <div class="tet-btns">
          <button class="btn" onclick="tetMove(-1)">←</button>
          <button class="btn" onclick="tetRotate()">↻</button>
          <button class="btn" onclick="tetMove(1)">→</button>
          <button class="btn" onclick="tetDown()">↓</button>
          <button class="btn btn-warn" onclick="tetHardDrop()" title="ハードドロップ">⏬</button>
          <button class="btn btn-purple" onclick="tetHold()" title="ホールド">📦</button>
        </div>
      </div>
    </div>`;
  const canvas=document.getElementById('tetris-canvas');
  const ctx=canvas.getContext('2d');
  const nextCanvas=document.getElementById('next-canvas');
  const nctx=nextCanvas.getContext('2d');
  const holdCanvas=document.getElementById('hold-canvas');
  const hctx=holdCanvas.getContext('2d');
  let board=Array.from({length:TETRIS_ROWS},()=>Array(TETRIS_COLS).fill(0));
  let cur, curX, curY, score=0, lines=0, lvl=1, gameOver=false, paused=false, holdPiece=null, canHold=true;
  function randPiece(){const idx=Math.floor(Math.random()*PIECES.length);return {idx,shape:JSON.parse(JSON.stringify(PIECES[idx].shape)),color:PIECES[idx].color};}
  let nextPiece=randPiece();
  function spawn(fromHold=null){cur=fromHold||nextPiece;if(!fromHold)nextPiece=randPiece();curX=Math.floor(TETRIS_COLS/2)-Math.floor(cur.shape[0].length/2);curY=0;if(!fromHold)canHold=true;drawNext();drawHold();if(!valid(cur.shape,curX,curY)){gameOver=true;endGame();}}
  function valid(shape,ox,oy){for(let r=0;r<shape.length;r++)for(let c=0;c<shape[r].length;c++){if(shape[r][c]){const nr=oy+r,nc=ox+c;if(nr<0||nr>=TETRIS_ROWS||nc<0||nc>=TETRIS_COLS||board[nr][nc])return false;}}return true;}
  function rotate(s){return s[0].map((_,i)=>s.map(r=>r[i]).reverse());}
  function place(){cur.shape.forEach((r,ri)=>r.forEach((v,ci)=>{if(v)board[curY+ri][curX+ci]=cur.color;}));clearLines();spawn();}
  function clearLines(){let cleared=0;for(let r=TETRIS_ROWS-1;r>=0;r--){if(board[r].every(c=>c)){board.splice(r,1);board.unshift(Array(TETRIS_COLS).fill(0));cleared++;r++;}}if(cleared){playSfx(cleared>=2?'combo':'merge');lines+=cleared;score+=[0,100,300,500,800][cleared]*lvl;lvl=Math.floor(lines/10)+1;document.getElementById('tet-score').textContent=score;document.getElementById('tet-lines').textContent=lines;document.getElementById('tet-lvl').textContent=lvl;clearInterval(tetrisInterval);tetrisInterval=setInterval(tick,Math.max(80,500-lvl*40));}}
  function tick(){if(gameOver||paused)return;if(valid(cur.shape,curX,curY+1))curY++;else place();draw();}
  function draw(){
    const bgg=ctx.createLinearGradient(0,0,0,TETRIS_ROWS*CELL);bgg.addColorStop(0,'#17143a');bgg.addColorStop(1,'#0b0a1c');ctx.fillStyle=bgg;ctx.fillRect(0,0,TETRIS_COLS*CELL,TETRIS_ROWS*CELL);
    // grid
    ctx.strokeStyle='rgba(140,150,255,0.07)';ctx.lineWidth=1;
    for(let r=0;r<TETRIS_ROWS;r++)for(let c=0;c<TETRIS_COLS;c++){ctx.strokeRect(c*CELL,r*CELL,CELL,CELL);}
    // board
    board.forEach((row,r)=>row.forEach((col,c)=>{if(col)tetrisBlock(ctx,c*CELL,r*CELL,CELL,col);}));
    // ghost
    let gy=curY; while(valid(cur.shape,curX,gy+1))gy++;
    cur.shape.forEach((row,r)=>row.forEach((v,c)=>{if(v){ctx.strokeStyle=cur.color;ctx.globalAlpha=.55;ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.strokeRect((curX+c)*CELL+3,(gy+r)*CELL+3,CELL-6,CELL-6);ctx.setLineDash([]);ctx.globalAlpha=1;}}));
    // current
    cur.shape.forEach((row,r)=>row.forEach((v,c)=>{if(v)tetrisBlock(ctx,(curX+c)*CELL,(curY+r)*CELL,CELL,cur.color);}));
  }
  function drawPreview(targetCtx,piece){
    targetCtx.fillStyle='#17143a';targetCtx.fillRect(0,0,80,80);
    if(!piece)return;
    const s=piece.shape, cs=16;
    const ox=Math.floor((80-s[0].length*cs)/2), oy=Math.floor((80-s.length*cs)/2);
    s.forEach((row,r)=>row.forEach((v,c)=>{if(v)tetrisBlock(targetCtx,ox+c*cs,oy+r*cs,cs,piece.color);}));
  }
  function drawNext(){drawPreview(nctx,nextPiece);}
  function drawHold(){drawPreview(hctx,holdPiece);}
  el._quit=()=>{if(gameOver)return;gameOver=true;if(score>0)endGame();else{clearInterval(tetrisInterval);recordQuit('tetris',0);}};
  function endGame(){
    clearInterval(tetrisInterval);
    if(score>0)recordWin('tetris',score);else recordLoss(0,'tetris');
    gameDelay(()=>{
      ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(0,0,TETRIS_COLS*CELL,TETRIS_ROWS*CELL);
      ctx.fillStyle='#ffd93d';ctx.font='bold 22px sans-serif';ctx.textAlign='center';
      ctx.fillText('GAME OVER',TETRIS_COLS*CELL/2,TETRIS_ROWS*CELL/2-20);
      ctx.fillStyle='#fff';ctx.font='16px sans-serif';
      ctx.fillText('Score: '+score,TETRIS_COLS*CELL/2,TETRIS_ROWS*CELL/2+10);
      ctx.fillText('Lines: '+lines,TETRIS_COLS*CELL/2,TETRIS_ROWS*CELL/2+34);
    },100);
    gameDelay(()=>{const r=document.createElement('div');r.className='result-box';r.style.marginTop='12px';r.innerHTML=`<div class="result-score">${score}</div><p>${lines}ライン消去！ Lv.${lvl}</p><div class="xp-gain">+${score} XP</div><button class="btn mt" onclick="startGame('tetris')">もう一度</button>`;el.appendChild(r);},300);
  }
  window.tetMove=dx=>{if(!gameOver&&valid(cur.shape,curX+dx,curY)){curX+=dx;draw();}};
  window.tetRotate=()=>{if(!gameOver){const r=rotate(cur.shape);if(valid(r,curX,curY))cur.shape=r;else if(valid(r,curX+1,curY)){cur.shape=r;curX++;}else if(valid(r,curX-1,curY)){cur.shape=r;curX--;}draw();}};
  window.tetDown=()=>{if(!gameOver){if(valid(cur.shape,curX,curY+1))curY++;else place();draw();}};
  window.tetHardDrop=()=>{if(!gameOver){while(valid(cur.shape,curX,curY+1)){curY++;score+=1;}document.getElementById('tet-score').textContent=score;place();draw();}};
  window.tetHold=()=>{
    if(gameOver||!canHold)return;
    canHold=false;
    const baseIdx=cur.idx!==undefined?cur.idx:PIECES.findIndex(p=>p.color===cur.color);
    const fresh={idx:baseIdx,shape:JSON.parse(JSON.stringify(PIECES[Math.max(0,baseIdx)].shape)),color:cur.color};
    const prev=holdPiece;holdPiece=fresh;
    playSfx('click');
    if(prev)spawn(prev);else spawn();
    draw();
  };
  let tsx=0,tsy=0;
  canvas.addEventListener('touchstart',e=>{if(!e.touches[0])return;tsx=e.touches[0].clientX;tsy=e.touches[0].clientY;},{passive:true});
  canvas.addEventListener('touchend',e=>{
    if(!e.changedTouches[0]||gameOver)return;
    const dx=e.changedTouches[0].clientX-tsx,dy=e.changedTouches[0].clientY-tsy;
    if(Math.max(Math.abs(dx),Math.abs(dy))<16){window.tetRotate();return;}
    if(Math.abs(dx)>Math.abs(dy))window.tetMove(dx>0?1:-1);
    else if(dy>40)window.tetHardDrop();
    else if(dy>0)window.tetDown();
  },{passive:true});
  document.removeEventListener('keydown',tetrisKeyHandler);
  tetrisKeyHandler=e=>{
    if(gameOver)return;
    if(e.key==='ArrowLeft'){e.preventDefault();window.tetMove(-1);}
    else if(e.key==='ArrowRight'){e.preventDefault();window.tetMove(1);}
    else if(e.key==='ArrowDown'){e.preventDefault();window.tetDown();}
    else if(e.key==='ArrowUp'){e.preventDefault();window.tetRotate();}
    else if(e.key===' '){e.preventDefault();window.tetHardDrop();}
    else if(e.key==='c'||e.key==='C'||e.key==='Shift'){e.preventDefault();window.tetHold();}
  };
  document.addEventListener('keydown',tetrisKeyHandler);
  spawn(); draw(); drawNext();
  tetrisInterval=setInterval(tick,500);
};
