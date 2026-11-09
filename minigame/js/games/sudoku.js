
GAME_DEFS.push(
  {id:'sudoku',icon:'🔢',title:'ナンプレ',desc:'縦・横・3×3の枠を1〜9で埋めよう。メモとヒント付き',tag:'パズル',color:'#a78bfa'},
  {id:'minigolf',icon:'⛳',title:'ミニゴルフ',desc:'引っぱってショット！壁の反射を使って全3ホールに挑戦',tag:'スポーツ',color:'#6bcb77'}
);
const SUDOKU_PUZZLE='530070000600195000098000060800060003400803001700020006060000280000419005000080079';
const SUDOKU_SOLUTION='534678912672195348198342567859761423426853791713924856961537284287419635345286179';
function sudokuConflicts(board,index){
  const value=board[index],row=Math.floor(index/9),col=index%9;
  return !!value&&board.some((v,j)=>j!==index&&v===value&&(Math.floor(j/9)===row||j%9===col||(Math.floor(j/27)===Math.floor(row/3)&&Math.floor((j%9)/3)===Math.floor(col/3))));
}
function sudokuComplete(board){return board.length===81&&board.every((v,i)=>Number.isInteger(v)&&v>=1&&v<=9&&!sudokuConflicts(board,i));}
games.sudoku=function(el){
  let board,initial,solution,notes,selected=0,memo=false,history=[],hints=0,ended=false,easy=false;
  const q=id=>el.querySelector('#'+id);
  el.innerHTML=`<style>
    .sdk-grid{display:grid;grid-template-columns:repeat(9,minmax(0,1fr));max-width:450px;margin:16px auto;border:3px solid var(--text);border-radius:14px;overflow:hidden;background:var(--surface);box-shadow:var(--shadow)}
    .sdk-cell{aspect-ratio:1;min-width:0;padding:0;border:1px solid var(--border);background:var(--surface);color:var(--accent4);font-weight:700;font-size:clamp(17px,4.5vw,26px);cursor:pointer;touch-action:manipulation;transition:background .1s}
    .sdk-cell.sdk-given{color:var(--text);font-weight:800;background:var(--surface2)}
    .sdk-cell.sdk-peer{background:color-mix(in srgb,var(--accent4) 9%,var(--surface))}.sdk-cell.sdk-given.sdk-peer{background:color-mix(in srgb,var(--accent4) 9%,var(--surface2))}.sdk-cell.sdk-same{background:color-mix(in srgb,var(--accent2) 22%,var(--surface))}.sdk-cell.sdk-selected{background:color-mix(in srgb,var(--accent2) 35%,var(--surface));outline:3px solid var(--accent2);outline-offset:-3px}
    .sdk-cell.sdk-error{color:var(--accent1);text-decoration:underline;background:var(--bad-bg)}
    .sdk-notes{display:grid;grid-template-columns:repeat(3,1fr);font-size:clamp(8px,2.1vw,12px);line-height:1.2;color:var(--text2)}
    .sdk-pad{display:grid;grid-template-columns:repeat(9,minmax(0,1fr));gap:4px;max-width:450px;margin:12px auto}.sdk-pad button{padding:10px 0;min-width:0;background:var(--surface);color:var(--text);border:1px solid var(--border);font-size:18px;font-weight:900;box-shadow:inset 0 -3px 0 rgba(0,0,0,.12)}
  </style><div class="game-header"><h2>🔢 ナンプレ</h2><p>縦・横・3×3の枠に1〜9を1つずつ。時間制限はありません。</p></div>
  <div id="sdk-menu" class="flex-center" style="gap:12px"><button class="btn" id="sdk-easy">やさしい</button><button class="btn" id="sdk-normal">通常</button></div><div id="sdk-play" hidden>
  <div id="sdk-grid" class="sdk-grid" role="group" aria-label="ナンプレの盤面"></div><div id="sdk-pad" class="sdk-pad">${Array.from({length:9},(_,i)=>`<button class="btn" data-digit="${i+1}">${i+1}</button>`).join('')}</div>
  <div class="flex-center" style="gap:8px;flex-wrap:wrap"><button class="btn" id="sdk-memo" aria-pressed="false">メモ OFF</button><button class="btn" id="sdk-clear">消去</button><button class="btn" id="sdk-undo">一手戻す</button><button class="btn" id="sdk-hint">ヒント</button></div><p id="sdk-status" role="status" style="text-align:center;min-height:3em"></p></div>`;
  function render(message='マスを選んで数字を入れてください。赤いマスは数字が重複しています。'){
    const peer=i=>selected>=0&&i!==selected&&(Math.floor(i/9)===Math.floor(selected/9)||i%9===selected%9||(Math.floor(i/27)===Math.floor(selected/27)&&Math.floor(i%9/3)===Math.floor(selected%9/3)));
    q('sdk-grid').innerHTML=board.map((v,i)=>`<button class="sdk-cell ${initial[i]?'sdk-given':''} ${selected===i?'sdk-selected':''} ${peer(i)?'sdk-peer':''} ${v&&selected>=0&&i!==selected&&v===board[selected]?'sdk-same':''} ${sudokuConflicts(board,i)?'sdk-error':''}" data-cell="${i}" aria-label="${Math.floor(i/9)+1}行${i%9+1}列、${v||'空白'}${initial[i]?'、固定':''}${notes[i].length?'、メモ'+notes[i].join('・'):''}" aria-pressed="${selected===i}" style="${i%9===2||i%9===5?'border-right:3px solid var(--text);':''}${Math.floor(i/9)===2||Math.floor(i/9)===5?'border-bottom:3px solid var(--text);':''}">${v||`<span class="sdk-notes">${Array.from({length:9},(_,n)=>`<span>${notes[i].includes(n+1)?n+1:'&nbsp;'}</span>`).join('')}</span>`}</button>`).join('');
    q('sdk-status').textContent=message+`（ヒント使用 ${hints}回）`;
    q('sdk-memo').textContent=`メモ ${memo?'ON':'OFF'}`;q('sdk-memo').setAttribute('aria-pressed',String(memo));q('sdk-undo').disabled=!history.length;
  }
  function snapshot(){history.push({board:board.slice(),notes:notes.map(n=>n.slice())});}
  function check(){if(sudokuComplete(board)&&!ended){ended=true;render('クリア！');recordWin('sudoku',Math.max(50,(easy?140:200)-hints*10));}else render();}
  function enter(value){
    if(ended||!board)return;
    if(initial[selected]){render('最初からある数字は変更できません。');return;}
    snapshot();
    if(memo&&value&&!board[selected]){const ns=notes[selected];notes[selected]=ns.includes(value)?ns.filter(n=>n!==value):[...ns,value].sort();}
    else{board[selected]=value;notes[selected]=[];}
    check();
  }
  function start(isEasy){
    easy=isEasy;
    const digits=[1,2,3,4,5,6,7,8,9];for(let i=8;i>0;i--){const j=Math.floor(Math.random()*(i+1));[digits[i],digits[j]]=[digits[j],digits[i]];}
    solution=Array.from(SUDOKU_SOLUTION,c=>digits[Number(c)-1]);
    initial=Array.from(SUDOKU_PUZZLE,(c,i)=>c!=='0'?solution[i]:(easy&&i%3===0?solution[i]:0));
    board=initial.slice();notes=Array.from({length:81},()=>[]);selected=initial.indexOf(0);
    q('sdk-menu').hidden=true;q('sdk-menu').style.display='none';q('sdk-play').hidden=false;render();
    el._quit=()=>{if(ended)return;ended=true;render('ここで終了しました。');recordQuit('sudoku',0);};if(typeof updateQuitBar==='function')updateQuitBar();
  }
  q('sdk-easy').onclick=()=>start(true);q('sdk-normal').onclick=()=>start(false);
  q('sdk-grid').onclick=e=>{const cell=e.target.closest('[data-cell]');if(cell&&!ended){selected=Number(cell.dataset.cell);render();q('sdk-grid').querySelector(`[data-cell="${selected}"]`).focus();}};
  q('sdk-pad').onclick=e=>{const button=e.target.closest('[data-digit]');if(button)enter(Number(button.dataset.digit));};
  q('sdk-memo').onclick=()=>{if(!ended){memo=!memo;render();}};
  q('sdk-clear').onclick=()=>enter(0);
  q('sdk-undo').onclick=()=>{if(ended||!history.length)return;const previous=history.pop();board=previous.board;notes=previous.notes;render();};
  q('sdk-hint').onclick=()=>{if(ended)return;const i=!initial[selected]&&board[selected]!==solution[selected]?selected:board.findIndex((v,j)=>v!==solution[j]);if(i<0)return;snapshot();selected=i;board[i]=solution[i];notes[i]=[];hints++;check();};
  function key(e){if(!board||ended||e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
    if(/^[1-9]$/.test(e.key)){e.preventDefault();enter(Number(e.key));}
    else if(['Backspace','Delete','0'].includes(e.key)){e.preventDefault();enter(0);}
    else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-9,ArrowDown:9}[e.key];selected=Math.max(0,Math.min(80,selected+delta));render();q('sdk-grid').querySelector(`[data-cell="${selected}"]`).focus();}
  }
  document.addEventListener('keydown',key);el._cleanup=()=>{ended=true;document.removeEventListener('keydown',key);};
};
