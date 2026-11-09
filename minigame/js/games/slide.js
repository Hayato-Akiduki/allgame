
// GAME 6: 2048 SLIDE
let slideKeyHandler = null;
games.slide = function(el) {
  let board = Array(16).fill(0), score = 0, ended=false, history=[], undosLeft=3;
  function addRandom() { const e=board.map((v,i)=>v===0?i:-1).filter(i=>i>=0); if(!e.length)return; board[e[Math.floor(Math.random()*e.length)]]=Math.random()<0.9?2:4; }
  addRandom(); addRandom();
  function slide(dir) {
    if(ended)return;
    const prevBoard=[...board], prevScore=score;
    let moved=false, mergedAny=false;
    function slideRow(row) {
      let r=row.filter(v=>v>0);
      for(let i=0;i<r.length-1;i++){if(r[i]===r[i+1]){r[i]*=2;score+=r[i];r.splice(i+1,1);moved=true;mergedAny=true;}}
      while(r.length<4)r.push(0); return r;
    }
    let rows=[]; for(let i=0;i<4;i++)rows.push(board.slice(i*4,i*4+4));
    if(dir==='left'||dir==='right'){
      rows=rows.map(r=>dir==='right'?slideRow(r.reverse()).reverse():slideRow(r));
      rows.forEach((r,i)=>{if(JSON.stringify(r)!==JSON.stringify(board.slice(i*4,i*4+4)))moved=true;});
      board=rows.flat();
    } else {
      let cols=[[],[],[],[]]; board.forEach((v,i)=>cols[i%4].push(v));
      cols=cols.map(c=>dir==='down'?slideRow(c.reverse()).reverse():slideRow(c));
      const nb=Array(16).fill(0); cols.forEach((c,ci)=>c.forEach((v,ri)=>nb[ri*4+ci]=v));
      if(JSON.stringify(nb)!==JSON.stringify(board))moved=true; board=nb;
    }
    if(moved){
      history.push({board:prevBoard,score:prevScore});
      if(history.length>5)history.shift();
      playSfx(mergedAny?'merge':'click');
      addRandom();render();
    }
    if(board.includes(2048)){ended=true;recordWin('slide',score);return;}
    const canMove=board.includes(0)||board.some((v,i)=>(i%4<3&&v===board[i+1])||(i<12&&v===board[i+4]));
    if(!canMove){
      ended=true;
      const maxTile=Math.max(...board);
      if(maxTile>=256||score>=1000)recordWin('slide',score);
      else{addScore(score,'slide');recordLoss(score,'slide');}
      el.insertAdjacentHTML('beforeend',`<div class="result-box"><div class="result-score">${score}</div><p>最大タイル: ${maxTile} ／ 動かせるマスがありません</p><button class="btn mt" onclick="startGame('slide')">もう一度</button></div>`);
    }
  }
  el._quit=()=>{if(ended)return;ended=true;const maxTile=Math.max(...board);if(maxTile>=256||score>=1000)recordWin('slide',score);else recordQuit('slide',score);};
  function undoMove(){
    if(ended||undosLeft<=0||!history.length)return;
    const prev=history.pop();
    board=prev.board;score=prev.score;undosLeft--;
    playSfx('click');render();
  }
  function render() {
    const maxTile=Math.max(...board,0), best=Math.max(saveData.highscores.slide||0,score);
    el.innerHTML = `
      <div class="game-header"><h2>🔢 スライドパズル</h2><p>スワイプ / 矢印キーで数字を合体！256タイルまたは1,000点以上でクリア判定</p></div>
      <div class="slide-info"><span>スコア: <strong class="score-num">${score}</strong></span><span>最大: <strong>${maxTile}</strong></span><span>ベスト: <strong>${best}</strong></span></div>
      <div class="slide-grid" id="sgrid" style="touch-action:none"></div>
      <p style="text-align:center;color:var(--text2);font-size:11px;margin-top:8px">盤面スワイプ / ← → ↑ ↓ キー / ボタンで操作</p>
      <div class="flex-center mt">
        <button class="btn btn-sm" onclick="slideMove('left')">←</button>
        <button class="btn btn-sm" onclick="slideMove('up')">↑</button>
        <button class="btn btn-sm" onclick="slideMove('down')">↓</button>
        <button class="btn btn-sm" onclick="slideMove('right')">→</button>
      </div>
      <div class="flex-center mt">
        <button class="btn btn-sm btn-purple" ${!history.length||undosLeft<=0||ended?'disabled':''} onclick="slideUndo()">↩ 1手戻す (${undosLeft})</button>
        <button class="btn btn-sm" onclick="startGame('slide')">リセット</button>
      </div>`;
    const grid=document.getElementById('sgrid');
    board.forEach(v=>{const c=document.createElement('div');c.className='slide-cell';c.textContent=v||'';c.dataset.v=v;grid.appendChild(c);});
    let sx=0,sy=0;
    grid.addEventListener('touchstart',e=>{if(!e.touches[0])return;sx=e.touches[0].clientX;sy=e.touches[0].clientY;},{passive:true});
    grid.addEventListener('touchend',e=>{if(!e.changedTouches[0])return;const dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;if(Math.max(Math.abs(dx),Math.abs(dy))<22)return;if(Math.abs(dx)>Math.abs(dy))slide(dx>0?'right':'left');else slide(dy>0?'down':'up');},{passive:true});
    window.slideMove=slide;
    window.slideUndo=undoMove;
  }
  document.removeEventListener('keydown',slideKeyHandler);
  slideKeyHandler=e=>{const m={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',a:'left',d:'right',w:'up',s:'down'};if(m[e.key]){e.preventDefault();slide(m[e.key]);}};
  document.addEventListener('keydown',slideKeyHandler);
  render();
};
