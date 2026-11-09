
// ================================================================
// GAME 14: MINESWEEPER (マインスイーパー)(gemini)
// ================================================================
games.minesweeper = function(el) {
  const DIFFS = {
    easy:   { label:'初級 9×9',   rows:9,  cols:9,  mines:10, score:300 },
    normal: { label:'中級 11×11', rows:11, cols:11, mines:16, score:450 },
    hard:   { label:'上級 11×13', rows:11, cols:13, mines:24, score:650 }
  };
  let diffKey = 'easy';
  let ROWS = 9, COLS = 9, MINES = 10;
  let board = [], gameOver = false, firstClick = true, flags = 0, opened = 0;
  let flagMode = false, pressTimer = null;

  function init(newDiff) {
    if(newDiff && DIFFS[newDiff]) diffKey = newDiff;
    const d = DIFFS[diffKey];
    ROWS = d.rows; COLS = d.cols; MINES = d.mines;
    board = Array.from({length: ROWS}, () => Array.from({length: COLS}, () => ({mine: false, open: false, flag: false, count: 0})));
    gameOver = false; firstClick = true; flags = 0; opened = 0;
    render();
  }

  function placeMines(ex, ey) {
    let placed = 0;
    while(placed < MINES) {
      let r = Math.floor(Math.random() * ROWS), c = Math.floor(Math.random() * COLS);
      if(!board[r][c].mine && (Math.abs(r-ey)>1 || Math.abs(c-ex)>1)) {
        board[r][c].mine = true; placed++;
      }
    }
    for(let r=0; r<ROWS; r++) {
      for(let c=0; c<COLS; c++) {
        if(!board[r][c].mine) {
          let cnt = 0;
          for(let dr=-1; dr<=1; dr++) for(let dc=-1; dc<=1; dc++) {
            const nr=r+dr, nc=c+dc;
            if(nr>=0&&nr<ROWS&&nc>=0&&nc<COLS&&board[nr][nc].mine) cnt++;
          }
          board[r][c].count = cnt;
        }
      }
    }
  }

  function openCell(r, c, skipRender=false) {
    if(gameOver || board[r][c].open || board[r][c].flag) return;
    if(firstClick) { placeMines(c, r); firstClick = false; }
    board[r][c].open = true;
    opened++;
    if(board[r][c].mine) {
      gameOver = true;
      board.forEach(row => row.forEach(cell => { if(cell.mine) cell.open = true; }));
      endGame(false); return;
    }
    if(board[r][c].count === 0) {
      for(let dr=-1; dr<=1; dr++) for(let dc=-1; dc<=1; dc++) {
        const nr=r+dr, nc=c+dc;
        if(nr>=0&&nr<ROWS&&nc>=0&&nc<COLS) openCell(nr, nc, true);
      }
    }
    if(!skipRender) {
      playSfx('click');
      if(opened === ROWS * COLS - MINES) { gameOver = true; endGame(true); }
      else render();
    }
  }

  function chordCell(r, c) {
    const cell = board[r]?.[c];
    if(!cell || !cell.open || cell.count <= 0 || gameOver) return;
    let adjFlags = 0;
    for(let dr=-1; dr<=1; dr++) for(let dc=-1; dc<=1; dc++) {
      const nr=r+dr, nc=c+dc;
      if(nr>=0&&nr<ROWS&&nc>=0&&nc<COLS&&board[nr][nc].flag) adjFlags++;
    }
    if(adjFlags !== cell.count) return;
    for(let dr=-1; dr<=1; dr++) for(let dc=-1; dc<=1; dc++) {
      const nr=r+dr, nc=c+dc;
      if(nr>=0&&nr<ROWS&&nc>=0&&nc<COLS&&!board[nr][nc].open&&!board[nr][nc].flag) {
        openCell(nr, nc, true);
        if(gameOver) return;
      }
    }
    playSfx('click');
    if(opened === ROWS * COLS - MINES) { gameOver = true; endGame(true); }
    else render();
  }

  function toggleFlag(r, c) {
    if(gameOver || board[r][c].open) return;
    board[r][c].flag = !board[r][c].flag;
    flags += board[r][c].flag ? 1 : -1;
    playSfx('click');
    render();
  }

  function endGame(win) {
    render();
    const score = win ? DIFFS[diffKey].score : 0;
    if(win) recordWin('minesweeper', score); else recordLoss();
    el.innerHTML += `<div class="result-box" style="margin-top:14px"><div class="result-score">${win ? '🎉 クリア！' : '💥 失敗...'}</div>${win ? xpResultHtml(score, 'minesweeper') : ''}<button class="btn mt" onclick="startGame('minesweeper')">もう一度</button></div>`;
  }

  function render() {
    const cellSize = COLS >= 13 ? 28 : COLS >= 11 ? 32 : 38;
    let html = `<div class="game-header"><h2>💣 マインスイーパー</h2><p>残り地雷: ${MINES - flags}個 ／ 開いた数字タップで周囲一括オープン・長押しで旗</p><p class="kbd-hint">矢印キーで移動、<kbd>Enter</kbd>／<kbd>Space</kbd> で開く、<kbd>F</kbd> で旗</p></div>`;
    html += `<div class="flex-center" style="margin-bottom:10px">${Object.entries(DIFFS).map(([k,d])=>`<button class="btn btn-sm ${diffKey===k?'btn-purple':''}" style="${diffKey===k?'':'background:var(--surface2)'}" onclick="msSetDiff('${k}')">${d.label}</button>`).join('')}</div>`;
    html += `<div style="text-align:center;margin-bottom:12px"><button class="btn btn-sm ${flagMode ? 'btn-danger' : 'btn-success'}" onclick="msToggleMode()">現在のモード: ${flagMode ? '🚩 旗立て' : '⛏️ 開ける'}</button></div>`;
    html += `<div class="ms-board" data-nav-group="ms" role="grid" aria-label="マインスイーパーの盤面" style="grid-template-columns:repeat(${COLS},${cellSize}px)">`;
    board.forEach((row, r) => {
      row.forEach((cell, c) => {
        let content = '', cls = 'ms-cell';
        if(cell.open) {
          cls += ' open' + (cell.mine ? ' boom' : '');
          if(cell.mine) content = '💣';
          else if(cell.count > 0) content = `<span class="ms-n${cell.count}">${cell.count}</span>`;
        } else if(cell.flag) { content = '🚩'; cls += ' flagged'; }
        const label = `${r+1}行${c+1}列 ${cell.open ? (cell.mine ? '地雷' : cell.count ? '数字'+cell.count : '空き') : cell.flag ? '旗' : '未開封'}`;
        html += `<div class="${cls}" role="button" data-nav data-r="${r}" data-c="${c}" aria-label="${label}" style=""width:${cellSize}px;height:${cellSize}px;font-size:${cellSize<=30?13:15}px" onclick="msCellClick(${r},${c})" oncontextmenu="event.preventDefault();msToggleFlag(${r},${c})" ontouchstart="msTouchStart(${r},${c})" ontouchmove="msTouchEnd()" ontouchend="msTouchEnd()">${content}</div>`;
      });
    });
    html += `</div>`;
    
    const rb = el.querySelector('.result-box');
    el.innerHTML = html;
    if(rb) el.appendChild(rb);

    window.msSetDiff = k => init(k);
    window.msCellClick = (r, c) => {
      if(board[r]?.[c]?.open) { chordCell(r, c); return; }
      if(flagMode) toggleFlag(r, c); else openCell(r, c);
    };
    window.msToggleFlag = toggleFlag;
    window.msToggleMode = () => { flagMode = !flagMode; render(); };
    window.msTouchStart = (r, c) => {
      clearTimeout(pressTimer);
      pressTimer = setTimeout(() => { toggleFlag(r, c); }, 420);
    };
    window.msTouchEnd = () => clearTimeout(pressTimer);
  }
  // F flags the focused cell, so keyboard players don't need to switch modes.
  onGameKey(key=>{
    if(key!=='f')return false;
    const cell=document.activeElement?.closest?.('.ms-cell');
    if(cell&&el.contains(cell))toggleFlag(Number(cell.dataset.r),Number(cell.dataset.c));
    return true;
  });
  init();
};
