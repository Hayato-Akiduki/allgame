
// GAME 2: REACTION
games.reaction = function(el) {
  let state = 'idle', t0, timer, results = [], round = 0, maxRound = 5;
  function render(msg, cls) {
    el.innerHTML = `
      <div class="game-header"><h2>⚡ 反応速度テスト</h2><p>${round}/${maxRound}回</p></div>
      <div id="reaction-area" class="${cls||''}" role="button" tabindex="0" aria-live="assertive">${msg}</div>
      <p class="kbd-hint center mt"><kbd>Space</kbd>／<kbd>Enter</kbd> でも反応できます</p>
      <div id="reaction-results" style="margin-top:14px"></div>`;
    document.getElementById('reaction-area').onclick = click;
    showResults();
  }
  function showResults() {
    if (!results.length) return;
    const div = document.getElementById('reaction-results');
    if (!div) return;
    const avg = Math.round(results.reduce((a,b)=>a+b,0)/results.length);
    div.innerHTML = `<div class="result-box"><p>平均: <strong style="color:var(--accent2);font-size:22px">${avg}ms</strong></p><p style="margin-top:6px">${results.map(r=>r+'ms').join(' / ')}</p></div>`;
  }
  function next() {
    if (round >= maxRound) {
      const avg = Math.round(results.reduce((a,b)=>a+b,0)/results.length);
      const score = Math.max(10, Math.round(3000/avg * 50));
      recordWin('reaction', score);
      el.innerHTML = `<div class="game-header"><h2>⚡ 結果</h2></div>
        <div class="result-box"><div class="result-score">${avg}ms</div><p>平均反応速度</p><div class="xp-gain">+${score} XP</div>
        <button class="btn mt" onclick="startGame('reaction')">もう一度</button></div>`;
      return;
    }
    state = 'wait'; render('待って...', 'wait');
    timer = gameDelay(() => { state = 'go'; t0 = Date.now(); render('今！', 'go'); }, 1500 + Math.random()*2500);
  }
  function click() {
    if (state === 'idle') { round = 0; results = []; next(); }
    else if (state === 'wait') { clearTimeout(timer);gameTimeouts.delete(timer);render('フライング！', 'wait');gameDelay(next,800); }
    else if (state === 'go') {
      const ms = Date.now()-t0; results.push(ms); round++;
      state = 'idle'; render(`${ms}ms！`, ''); gameDelay(next,800);
    }
  }
  // Space/Enter anywhere counts as a tap, so keyboard players react as fast as mouse players.
  onGameKey((key,e)=>{if(key!==' '&&key!=='Enter')return false;if(!e.repeat&&document.getElementById('reaction-area'))click();return true;});
  render('クリック・タップ・Spaceでスタート', '');
};
