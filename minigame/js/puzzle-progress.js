// Ad-inspired mini-games: deterministic puzzle flow and distance-based runner.
// Stage puzzles (pin pull, water sort, sokoban) save the next stage so players can continue later.
// Guards keep these working where saveData doesn't exist (the Node tests run game code in isolation).
function puzzleProgress(gameId,total){
  const saved=typeof saveData!=='undefined'?saveData.puzzleProgress?.[gameId]:null;
  return saved&&Number.isInteger(saved.stage)&&saved.stage>0&&saved.stage<total?saved:null;
}
function savePuzzleProgress(gameId,data){
  if(typeof saveData==='undefined')return;
  saveData.puzzleProgress=saveData.puzzleProgress||{};
  if(data&&(saveData.puzzleProgress[gameId]?.stage||0)>data.stage)return;
  if(data)saveData.puzzleProgress[gameId]={...data,savedAt:new Date().toISOString()};
  else delete saveData.puzzleProgress[gameId];
  if(typeof persistSave==='function')persistSave();
}
// Shows "continue from stage N" above the board; the game stays playable from stage 1 underneath.
function showPuzzleResume(el,gameId,saved,total,onResume){
  const box=document.createElement('div');box.className='puzzle-resume';box.setAttribute('role','group');box.setAttribute('aria-label','続きから遊ぶ');
  box.innerHTML=`<div><strong>▶ 続きから遊べます</strong><small>前回はステージ ${saved.stage+1} / ${total} まで進んでいます</small></div><div class="puzzle-resume-btns"><button class="btn btn-success" type="button" data-resume>ステージ${saved.stage+1}から</button><button class="btn btn-sm" type="button" data-fresh>最初から</button></div>`;
  box.querySelector('[data-resume]').onclick=()=>{box.remove();onResume(saved);};
  box.querySelector('[data-fresh]').onclick=()=>{box.remove();savePuzzleProgress(gameId,null);};
  const header=el.querySelector('.game-header')||el.querySelector('h2');
  if(header)header.after(box);else el.prepend(box);
  return box;
}
