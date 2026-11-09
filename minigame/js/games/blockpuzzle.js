
// GAME: NUMBER BLOCK (8x8 block puzzle)
const BP_SHAPES=[
  [[0,0]],[[0,0],[1,0]],[[0,0],[0,1]],[[0,0],[1,0],[2,0]],[[0,0],[0,1],[0,2]],
  [[0,0],[1,0],[2,0],[3,0]],[[0,0],[0,1],[0,2],[0,3]],[[0,0],[1,0],[2,0],[3,0],[4,0]],[[0,0],[0,1],[0,2],[0,3],[0,4]],
  [[0,0],[1,0],[0,1],[1,1]],[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[0,2],[1,2],[2,2]],
  [[0,0],[0,1],[1,1]],[[0,0],[1,0],[0,1]],[[0,0],[1,0],[1,1]],[[1,0],[0,1],[1,1]],
  [[0,0],[0,1],[0,2],[1,2]],[[0,0],[1,0],[2,0],[0,1]],[[0,0],[1,0],[1,1],[1,2]],[[2,0],[0,1],[1,1],[2,1]],
  [[0,0],[1,0],[2,0],[1,1]],[[1,0],[0,1],[1,1],[2,1]]
];
const BP_COLORS=['#ff6b6b','#ffb547','#6bcb77','#4d96ff','#c77dff','#47c9dc','#ff8fab'];
games.blockpuzzle=function(el){
  const N=8,WIN_SCORE=300;
  let board=[],tray=[],selected=null,score=0,lines=0,swapUsed=false,ended=false;
  const q=id=>el.querySelector('#'+id);
  const sizeOf=cells=>({w:Math.max(...cells.map(c=>c[0]))+1,h:Math.max(...cells.map(c=>c[1]))+1});
  const randomPiece=()=>({cells:BP_SHAPES[Math.floor(Math.random()*BP_SHAPES.length)],color:BP_COLORS[Math.floor(Math.random()*BP_COLORS.length)],used:false});
  // The tapped cell becomes the piece's center, which is easier to aim on a phone than the corner.
  function origin(piece,cx,cy){const s=sizeOf(piece.cells);return [cx-Math.floor((s.w-1)/2),cy-Math.floor((s.h-1)/2)];}
  function fits(piece,ox,oy){return piece.cells.every(([x,y])=>{const px=ox+x,py=oy+y;return px>=0&&py>=0&&px<N&&py<N&&!board[py*N+px];});}
  function canPlaceAnywhere(piece){for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(fits(piece,x,y))return true;return false;}
  function deal(){
    for(let attempt=0;attempt<12;attempt++){tray=[randomPiece(),randomPiece(),randomPiece()];if(tray.some(canPlaceAnywhere))break;}
    selected=0;
  }
  function start(){
    board=Array(N*N).fill(null);score=0;lines=0;swapUsed=false;ended=false;deal();
    el.innerHTML=`<div class="game-header"><h2>🧩 ナンバーブロック</h2><p id="bp-status">ピースを選んで、置きたい場所をタップ</p><p class="kbd-hint"><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> でピース選択、矢印キーで場所を選んで <kbd>Enter</kbd> で置く</p></div>
      <div class="info-row">
        <div class="info-box"><div class="ib-val" id="bp-score">0</div><div class="ib-label">スコア</div></div>
        <div class="info-box"><div class="ib-val" id="bp-lines">0</div><div class="ib-label">消したライン</div></div>
        <div class="info-box"><div class="ib-val">${WIN_SCORE}</div><div class="ib-label">目標</div></div>
      </div>
      <div class="bp-board" id="bp-board" data-nav-group="bp" aria-label="8×8の盤面"></div>
      <div class="bp-tray" id="bp-tray"></div>
      <div class="flex-center"><button class="btn btn-sm btn-purple" id="bp-swap">🔄 ピース入替（1回）</button><button class="btn btn-sm" id="bp-reset">最初から</button></div>`;
    const b=q('bp-board');
    for(let i=0;i<N*N;i++){
      const c=document.createElement('div');c.className='bp-cell';c.setAttribute('role','button');c.setAttribute('data-nav','');c.setAttribute('aria-label',`${i%N+1}列${Math.floor(i/N)+1}行`);
      c.addEventListener('click',()=>place(i%N,Math.floor(i/N)));
      c.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')preview(i%N,Math.floor(i/N));});
      // Keyboard focus shows where the piece would land, like hovering with a mouse.
      c.addEventListener('focus',()=>{if(keyboardMode)preview(i%N,Math.floor(i/N));});c.addEventListener('blur',()=>preview(-1,-1));
      b.appendChild(c);
    }
    b.addEventListener('pointerleave',()=>preview(-1,-1));
    q('bp-swap').onclick=swap;q('bp-reset').onclick=()=>startGame('blockpuzzle');
    onGameKey(key=>{const i=['1','2','3'].indexOf(key);if(i<0||ended||!tray[i]||tray[i].used)return false;selected=i;playSfx('click');render();
      const cell=document.activeElement?.closest?.('.bp-cell');if(cell){const k=[...q('bp-board').children].indexOf(cell);preview(k%N,Math.floor(k/N));}return true;});
    render();
  }
  function render(){
    const cells=q('bp-board').children;
    board.forEach((color,i)=>{cells[i].style.background=color||'';cells[i].classList.toggle('filled',!!color);cells[i].classList.remove('preview-ok','preview-bad');});
    q('bp-tray').innerHTML=tray.map((p,i)=>{
      const s=sizeOf(p.cells),fill=new Set(p.cells.map(([x,y])=>y*s.w+x));
      const mini=Array.from({length:s.w*s.h},(_,k)=>`<i class="bp-mini-cell" style="background:${fill.has(k)?p.color:'transparent'}"></i>`).join('');
      return `<button class="bp-piece-btn ${selected===i?'selected':''}" data-piece="${i}" ${p.used||ended?'disabled':''} aria-label="${p.cells.length}マスのピース"><span class="bp-mini-grid" style="grid-template-columns:repeat(${s.w},14px)">${p.used?'':mini}</span><small>${p.used?'配置済み':p.cells.length+'マス'}</small></button>`;
    }).join('');
    q('bp-tray').querySelectorAll('[data-piece]').forEach(btn=>btn.onclick=()=>{selected=Number(btn.dataset.piece);playSfx('click');render();});
    q('bp-score').textContent=score.toLocaleString();q('bp-lines').textContent=lines;
    q('bp-swap').disabled=swapUsed||ended;
  }
  function preview(cx,cy){
    const cells=q('bp-board')?.children;if(!cells)return;
    for(const c of cells)c.classList.remove('preview-ok','preview-bad');
    const piece=tray[selected];if(cx<0||ended||!piece||piece.used)return;
    const [ox,oy]=origin(piece,cx,cy),ok=fits(piece,ox,oy);
    piece.cells.forEach(([x,y])=>{const px=ox+x,py=oy+y;if(px>=0&&py>=0&&px<N&&py<N)cells[py*N+px].classList.add(ok?'preview-ok':'preview-bad');});
  }
  function status(text){q('bp-status').textContent=text;}
  function place(cx,cy){
    if(ended)return;const piece=tray[selected];
    if(!piece||piece.used){status('先に下のピースを選んでください');return;}
    const [ox,oy]=origin(piece,cx,cy);
    if(!fits(piece,ox,oy)){status('そこには置けません');playSfx('warn');preview(cx,cy);return;}
    piece.cells.forEach(([x,y])=>{board[(oy+y)*N+ox+x]=piece.color;});
    piece.used=true;score+=piece.cells.length;
    const fullRows=[],fullCols=[];
    for(let i=0;i<N;i++){
      if([...Array(N).keys()].every(x=>board[i*N+x]))fullRows.push(i);
      if([...Array(N).keys()].every(y=>board[y*N+i]))fullCols.push(i);
    }
    const cleared=fullRows.length+fullCols.length;
    if(cleared){
      fullRows.forEach(y=>{for(let x=0;x<N;x++)board[y*N+x]=null;});
      fullCols.forEach(x=>{for(let y=0;y<N;y++)board[y*N+x]=null;});
      const bonus=cleared*cleared*20;score+=bonus;lines+=cleared;playSfx(cleared>1?'combo':'clear');
      status(cleared>1?`🔥 ${cleared}ライン同時消し！ +${bonus}`:`ライン消去！ +${bonus}`);
    }else{playSfx('pop');status(`+${piece.cells.length}点`);}
    if(tray.every(p=>p.used))deal();
    else{const next=tray.findIndex(p=>!p.used);if(tray[selected].used)selected=next;}
    render();checkEnd();
  }
  function swap(){
    if(swapUsed||ended)return;swapUsed=true;deal();status('🔄 ピースを入れ替えました');playSfx('click');render();checkEnd();
  }
  function checkEnd(){
    if(tray.some(p=>!p.used&&canPlaceAnywhere(p)))return;
    if(!swapUsed){status('置ける場所がありません。「ピース入替」を使おう！');return;}
    finish('置ける場所がなくなりました');
  }
  function finish(message,quit=false){
    if(ended)return;ended=true;render();status(message);
    el.insertAdjacentHTML('beforeend',`<div class="result-box"><div class="result-score">${score.toLocaleString()}</div><p>${lines}ライン消去${score>=WIN_SCORE?'・🎉 目標達成！':''}</p><button class="btn mt" onclick="startGame('blockpuzzle')">もう一度</button></div>`);
    if(score>=WIN_SCORE)recordWin('blockpuzzle',score);else if(quit)recordQuit('blockpuzzle',score);else{addScore(score,'blockpuzzle');recordLoss(score,'blockpuzzle');}
  }
  start();
  el._quit=()=>finish('ここで終了しました',true);
  el._cleanup=()=>{ended=true;};
};
