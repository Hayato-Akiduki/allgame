
// GAME 24: SOKOBAN
games.sokoban = function(el) {
  const LEVELS=[
    ['#######','#     #','#  .  #','#  $  #','#  @  #','#######'],
    ['########','# .  . #','# $  $ #','#   @  #','#      #','########'],
    ['########','# .    #','# $ #  #','#   #. #','#  $   #','#  @   #','########'],
    ['#########','# . . . #','# $ $ $ #','#   @   #','#       #','#########'],
    ['#########','# . # . #','# $   $ #','#   $   #','#   .   #','#   @   #','#       #','#########'],
    ['########','#      #','#      #','#  # $ #','# . $###','#  .@ ##','########'],
    ['########','##    .#','####$  #','#@$  # #','##     #','#  ##  #','#    . #','########'],
    ['########','#      #','## #  .#','#    $$#','### #..#','#@$    #','# #  # #','########'],
    ['#########','#      ##','##$$#   #','#       #','#  # # ##','##$ .   #','# @  .. #','#########'],
    ['#########','# #    .#','#  ###  #','#    $@ #','#  $# . #','# # #$ ##','#   #  .#','#########'],
    ['#########','#  . # .#','#   #   #','##   $# #','#   #  .#','#   #$  #','# $   $@#','#  ## .##','#########'],
    ['##########','###  #@  #','# # # $$ #','#.   #  ##','###    $##','#   .#   #','#  .  $ ##','# . ##  ##','##########']
  ];
  let level=0,walls=new Set(),goals=new Set(),boxes=new Set(),player={x:0,y:0},moves=0,pushes=0,totalScore=0,history=[],completed=false,pointerStart=null;
  const key=(x,y)=>`${x},${y}`;

  el.innerHTML=`<div class="game-header"><h2>📦 倉庫番</h2><p id="soko-status">箱をすべて黄色いゴールへ運ぼう</p></div>
    <div class="info-row">
      <div class="info-box"><div class="ib-val" id="soko-level">1 / ${LEVELS.length}</div><div class="ib-label">ステージ</div></div>
      <div class="info-box"><div class="ib-val" id="soko-moves">0</div><div class="ib-label">手数</div></div>
      <div class="info-box"><div class="ib-val" id="soko-pushes">0</div><div class="ib-label">箱押し</div></div>
      <div class="info-box"><div class="ib-val" id="soko-score">0</div><div class="ib-label">合計点</div></div>
    </div>
    <div class="sokoban-board" id="soko-board" aria-label="倉庫番の盤面"></div>
    <div class="sokoban-controls">
      <span></span><button class="btn" data-move="0,-1" aria-label="上">▲</button><span></span>
      <button class="btn" data-move="-1,0" aria-label="左">◀</button><button class="btn" data-move="0,1" aria-label="下">▼</button><button class="btn" data-move="1,0" aria-label="右">▶</button>
    </div>
    <div class="flex-center mt"><button class="btn btn-sm" id="soko-undo">↶ 1手戻す</button><button class="btn btn-sm" id="soko-reset">リセット</button></div>
    <div id="soko-result"></div>`;
  const board=el.querySelector('#soko-board'),status=el.querySelector('#soko-status'),result=el.querySelector('#soko-result');

  function loadLevel(index){
    level=index;walls=new Set();goals=new Set();boxes=new Set();history=[];moves=pushes=0;completed=false;result.innerHTML='';
    LEVELS[level].forEach((row,y)=>[...row].forEach((c,x)=>{
      if(c==='#')walls.add(key(x,y));
      if(c==='.'||c==='*'||c==='+')goals.add(key(x,y));
      if(c==='$'||c==='*')boxes.add(key(x,y));
      if(c==='@'||c==='+')player={x,y};
    }));
    status.textContent=`ステージ ${level+1}：箱をすべてゴールへ！`;render();
  }
  function render(){
    const map=LEVELS[level],width=Math.max(...map.map(r=>r.length));
    board.style.gridTemplateColumns=`repeat(${width},1fr)`;board.innerHTML='';
    for(let y=0;y<map.length;y++)for(let x=0;x<width;x++){
      const k=key(x,y),cell=document.createElement('div');cell.className='sokoban-cell';
      if(walls.has(k))cell.classList.add('wall');
      if(goals.has(k))cell.classList.add('goal');
      if(boxes.has(k)){cell.classList.add('box');cell.textContent='📦';}
      if(player.x===x&&player.y===y)cell.textContent='🧑';
      board.appendChild(cell);
    }
    el.querySelector('#soko-level').textContent=`${level+1} / ${LEVELS.length}`;
    el.querySelector('#soko-moves').textContent=moves;el.querySelector('#soko-pushes').textContent=pushes;
    el.querySelector('#soko-score').textContent=totalScore.toLocaleString();
  }
  function move(dx,dy){
    if(completed)return;
    const tx=player.x+dx,ty=player.y+dy,target=key(tx,ty);if(walls.has(target))return;
    let pushing=false,beyond='';
    if(boxes.has(target)){
      beyond=key(tx+dx,ty+dy);if(walls.has(beyond)||boxes.has(beyond))return;pushing=true;
    }
    history.push({player:{...player},boxes:[...boxes],moves,pushes});
    if(pushing){boxes.delete(target);boxes.add(beyond);pushes++;}
    player={x:tx,y:ty};moves++;render();
    if([...goals].every(g=>boxes.has(g)))completeStage();
  }
  function completeStage(){
    completed=true;const earned=Math.max(100,500-moves*3-pushes*4)+(level+1)*25;totalScore+=earned;render();
    status.textContent=`ステージ ${level+1} クリア！ スコア +${earned}`;
    if(level===LEVELS.length-1){
      savePuzzleProgress('sokoban',null);
      recordWin('sokoban',totalScore);
      result.innerHTML=`<div class="result-box mt"><div class="result-score">${totalScore.toLocaleString()}</div><p>🎉 全${LEVELS.length}ステージ攻略！</p>${xpResultHtml(totalScore,'sokoban')}<button class="btn btn-warn mt" onclick="startGame('sokoban')">もう一度</button></div>`;
    }else{savePuzzleProgress('sokoban',{stage:level+1,totalScore});result.innerHTML=`<div class="center mt"><button class="btn btn-success" id="soko-next">次のステージへ →</button></div>`;}
  }
  function undo(){
    if(completed||!history.length)return;const prev=history.pop();player=prev.player;boxes=new Set(prev.boxes);moves=prev.moves;pushes=prev.pushes;status.textContent='1手戻しました';render();
  }
  el.querySelectorAll('[data-move]').forEach(b=>b.addEventListener('click',()=>{const [dx,dy]=b.dataset.move.split(',').map(Number);move(dx,dy);}));
  el.querySelector('#soko-undo').addEventListener('click',undo);
  el.querySelector('#soko-reset').addEventListener('click',()=>loadLevel(level));
  result.addEventListener('click',e=>{if(e.target.id==='soko-next')loadLevel(level+1);});
  const keyHandler=e=>{
    const dirs={ArrowUp:[0,-1],w:[0,-1],W:[0,-1],ArrowDown:[0,1],s:[0,1],S:[0,1],ArrowLeft:[-1,0],a:[-1,0],A:[-1,0],ArrowRight:[1,0],d:[1,0],D:[1,0]};
    if(dirs[e.key]){e.preventDefault();move(...dirs[e.key]);}else if(e.key==='z'||e.key==='Z')undo();
  };
  document.addEventListener('keydown',keyHandler);
  board.addEventListener('pointerdown',e=>{pointerStart={x:e.clientX,y:e.clientY};});
  board.addEventListener('pointerup',e=>{
    if(!pointerStart)return;const dx=e.clientX-pointerStart.x,dy=e.clientY-pointerStart.y;pointerStart=null;if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;
    if(Math.abs(dx)>Math.abs(dy))move(Math.sign(dx),0);else move(0,Math.sign(dy));
  });
  loadLevel(0);
  const saved=puzzleProgress('sokoban',LEVELS.length);
  if(saved)showPuzzleResume(el,'sokoban',saved,LEVELS.length,s=>{totalScore=s.totalScore||0;loadLevel(s.stage);status.textContent=`ステージ ${level+1} から再開！`;});
  el._quit=()=>{if(completed&&level===LEVELS.length-1)return;completed=true;result.innerHTML='';status.textContent='ここで終了しました。続きは次回このステージから遊べます。';recordQuit('sokoban',totalScore);};
  el._cleanup=()=>document.removeEventListener('keydown',keyHandler);
};
