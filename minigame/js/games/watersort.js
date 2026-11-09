
// Water Sort: arrays store liquid from bottom to top.
const WATER_SORT_STAGES = [
  [[0,1,0,1],[1,0,1,0],[],[]],
  [[0,1,2,0],[1,2,0,1],[2,0,1,2],[],[]],
  [[0,1,2,3],[1,2,3,0],[2,3,0,1],[3,0,1,2],[],[]],
  [[0,2,0,3],[1,1,0,2],[1,2,3,0],[3,3,2,1],[],[]],
  [[3,2,1,3],[1,0,2,0],[2,1,2,0],[1,3,3,0],[],[]],
  [[2,0,1,1],[3,4,0,3],[0,0,3,2],[4,2,3,2],[1,4,4,1],[],[]],
  [[2,4,2,1],[1,2,0,5],[4,2,5,5],[0,3,3,0],[4,4,3,1],[0,5,3,1],[],[]],
  [[5,3,2,5],[3,4,2,4],[1,0,1,4],[5,3,1,2],[5,1,0,0],[2,3,0,4],[],[]],
  [[3,0,6,0],[3,4,2,6],[4,1,0,5],[3,1,6,2],[2,0,5,6],[1,5,5,4],[1,3,2,4],[],[]],
  [[1,0,5,0],[3,2,4,3],[2,3,2,4],[1,4,0,5],[3,1,2,5],[4,0,1,5],[]],
  [[3,2,4,1],[1,0,1,0],[3,2,3,1],[4,2,4,2],[0,0,4,3],[]],
  [[5,2,4,2],[2,6,5,5],[0,3,4,6],[1,1,0,6],[0,5,4,0],[3,1,1,2],[6,3,4,3],[]]
];
function waterSortPour(board,from,to){
  if(from===to||!board[from]?.length||!board[to]||board[to].length>=4)return null;
  const src=board[from],dst=board[to],color=src[src.length-1];
  if(dst.length&&dst[dst.length-1]!==color)return null;
  let count=1;
  while(count<src.length&&src[src.length-1-count]===color)count++;
  count=Math.min(count,4-dst.length);
  const next=board.map(t=>t.slice());
  next[to].push(...next[from].splice(src.length-count,count));
  return next;
}
function waterSortSolved(board){
  return board.every(t=>!t.length||(t.length===4&&t.every(c=>c===t[0])));
}
games.watersort = function(el){
  let stage=0,board=[],history=[],selected=-1,moves=0,completedMoves=0,finished=false,anim={from:-1,to:-1,shake:-1};
  const colors=['#ff7a8f','#4fc7f5','#ffd24d','#8ddc6a','#b98cff','#ff9c4a','#b07c56'];
  const names=['ピンク','青','黄','緑','紫','オレンジ','茶']; 
  el.innerHTML=`<div class="game-header"><h2>🧪 ウォーターソート</h2><p>移す元 → 移す先の順にタップ。同じ色をそろえよう！</p><p class="kbd-hint"><kbd>1</kbd>〜<kbd>9</kbd> または矢印キー＋<kbd>Enter</kbd> で容器を選ぶ</p></div>
  <div class="info-row">
    <div class="info-box"><div class="ib-val" id="ws-stage">1/${WATER_SORT_STAGES.length}</div><div class="ib-label">ステージ</div></div>
    <div class="info-box"><div class="ib-val" id="ws-moves">0</div><div class="ib-label">手数</div></div>
    <div class="info-box"><div class="ib-val" id="ws-done">0/0</div><div class="ib-label">完成した色</div></div>
  </div>
  <p id="ws-progress" class="sr-only"></p>
  <div class="ws-shelf"><div class="ws-board" id="ws-board" data-nav-group="tubes"></div></div>
  <p id="ws-status" class="ws-status" role="status" aria-live="polite"></p>
  <div class="flex-center ws-controls"><button class="btn btn-sm" id="ws-undo">↶ 一手戻す</button><button class="btn btn-sm" id="ws-reset">やり直す</button><button class="btn btn-success" id="ws-next" hidden>次のステージへ →</button></div>`;
  const q=id=>el.querySelector('#'+id);
  const full=t=>t.length===4&&t.every(c=>c===t[0]);
  // Adjacent layers of the same colour are drawn as one block of liquid.
  function segments(tube){const out=[];tube.forEach(c=>{const last=out[out.length-1];if(last&&last.c===c)last.n++;else out.push({c,n:1});});return out;}
  function render(message='移す元の容器を選んでください。',tone=''){
    const solved=waterSortSolved(board),colorCount=new Set(board.flat()).size;
    q('ws-progress').textContent=`ステージ ${stage+1} / ${WATER_SORT_STAGES.length} ・ ${moves}手`;
    q('ws-stage').textContent=`${stage+1}/${WATER_SORT_STAGES.length}`;q('ws-moves').textContent=moves;
    q('ws-done').textContent=`${board.filter(full).length}/${colorCount}`;
    q('ws-board').dataset.count=board.length;
    q('ws-board').innerHTML=board.map((tube,i)=>{
      const segs=segments(tube),cls=['ws-tube',full(tube)?'done':'',anim.from===i?'pour-out':'',anim.to===i?'pour-in':'',anim.shake===i?'shake':''].filter(Boolean).join(' ');
      return `<button class="${cls}" data-tube="${i}" data-nav aria-pressed="${selected===i}" aria-label="容器${i+1}、${tube.length?'下から'+tube.map(c=>names[c]+(c+1)).join('、'):'空'}" ${solved?'disabled':''}>`+
        `<span class="ws-glass"><span class="ws-liquid">${segs.map((s,n)=>`<span class="ws-seg${n===segs.length-1?' top':''}" style="--c:${colors[s.c]};height:${s.n*25}%" aria-hidden="true"><b>${s.c+1}</b></span>`).join('')}</span></span>`+
        `${full(tube)?'<span class="ws-check" aria-hidden="true">✓</span>':''}</button>`;
    }).join('');
    const status=q('ws-status');status.textContent=message;status.dataset.tone=solved?'good':tone;
    q('ws-undo').disabled=!history.length||solved;
    q('ws-reset').disabled=solved;
    q('ws-next').hidden=!solved||finished;
    anim={from:-1,to:-1,shake:-1};
  }
  function reset(){board=WATER_SORT_STAGES[stage].map(t=>t.slice());history=[];selected=-1;moves=0;render();}
  q('ws-board').onclick=event=>{
    const button=event.target.closest('[data-tube]');
    if(!button||finished||waterSortSolved(board))return;
    const i=Number(button.dataset.tube);
    if(selected===i){selected=-1;render();return;}
    if(selected<0){if(!board[i].length){anim.shake=i;render('空の容器からは注げません。','bad');return;}selected=i;playSfx('click');render('移す先の容器を選んでください。');return;}
    const next=waterSortPour(board,selected,i);
    if(!next){anim.shake=i;playSfx('warn');render('同じ色の上か、空いている容器を選んでください。','bad');return;}
    history.push(board);anim.from=selected;anim.to=i;board=next;selected=-1;moves++;
    if(waterSortSolved(board)){
      playSfx('clear');
      if(stage===WATER_SORT_STAGES.length-1){finished=true;savePuzzleProgress('watersort',null);render('🎉 全ステージクリア！');recordWin('watersort',Math.max(300,1500-(completedMoves+moves)*4));}
      else{savePuzzleProgress('watersort',{stage:stage+1,completedMoves:completedMoves+moves});render('✨ 色がそろいました！ 次のステージへ進めます。');}
    }else{playSfx(full(board[i])?'merge':'pop');render(full(board[i])?'✓ 1色完成！':undefined);}
  };
  q('ws-undo').onclick=()=>{if(!history.length||finished||waterSortSolved(board))return;board=history.pop();moves--;selected=-1;render('一手戻しました。');};
  q('ws-reset').onclick=()=>{if(!finished&&!waterSortSolved(board))reset();};
  el._quit=()=>{if(finished)return;finished=true;const cleared=stage+(waterSortSolved(board)?1:0);render('ここで終了しました。続きは次回このステージから遊べます。');recordQuit('watersort',cleared*60);};
  // Number keys pick a tube, matching the numbers in each tube's label.
  onGameKey(key=>{if(!/^[1-9]$/.test(key))return false;q('ws-board').querySelector(`[data-tube="${Number(key)-1}"]`)?.click();return true;});
  q('ws-next').onclick=()=>{if(finished||!waterSortSolved(board))return;completedMoves+=moves;stage++;reset();};
  reset();
  const saved=puzzleProgress('watersort',WATER_SORT_STAGES.length);
  if(saved)showPuzzleResume(el,'watersort',saved,WATER_SORT_STAGES.length,s=>{stage=s.stage;completedMoves=s.completedMoves||0;reset();render('続きから再開しました。');});
};
