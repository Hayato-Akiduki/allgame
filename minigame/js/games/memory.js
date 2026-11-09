
// GAME 1: MEMORY
games.memory = function(el) {
  const modes={easy:{name:'かんたん',pairs:4},normal:{name:'ふつう',pairs:8},hard:{name:'むずかしい',pairs:12}};
  el.innerHTML=`<div class="game-header"><h2>🧠 神経衰弱</h2><p>同じ絵柄のペアを見つけよう！</p></div>
    <div class="result-box"><h3>難易度を選択</h3><div class="flex-center mt">${Object.entries(modes).map(([id,m])=>`<button class="btn" data-memory-mode="${id}">${m.name}（${m.pairs*2}枚）</button>`).join('')}</div></div>`;
  el.querySelectorAll('[data-memory-mode]').forEach(b=>b.addEventListener('click',()=>start(b.dataset.memoryMode)));
  function start(id){
  const mode=modes[id],pairs=mode.pairs;
  const symbols=[...MEMORY_EMOJIS,'🐼','🐬','🐸','🐙'].slice(0,pairs);
  let cards = [...symbols, ...symbols];
  for(let i=cards.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[cards[i],cards[j]]=[cards[j],cards[i]];}
  let flipped = [], matched = 0, moves = 0, locked = false;
  let matched_ids = new Set();

  // 骨格を一度だけ作る（innerHTML の上書きをしない）
  el.innerHTML = `
    <div class="game-header"><h2>🧠 神経衰弱</h2>
      <p>${mode.name}・${pairs*2}枚</p><p id="mem-status">手数: 0 | ペア: 0/${pairs}</p>
    </div>
    <div class="memory-grid" id="mem-grid" data-nav-group="memory"></div><p class="kbd-hint center mt">矢印キーで選んで <kbd>Enter</kbd>／<kbd>Space</kbd> でめくる</p>
    <div class="center mt"><button class="btn btn-sm" onclick="startGame('memory')">難易度選択へ</button></div>
    <div id="mem-result"></div>`;

  // カードDOMを生成して保持
  const grid = document.getElementById('mem-grid');
  const cardEls = cards.map((em, i) => {
    const c = document.createElement('div');
    c.className = 'mem-card';
    c.setAttribute('role','button');c.setAttribute('data-nav','');c.setAttribute('aria-label',`カード${i+1}`);
    c.innerHTML = `<span class="mem-front">❓</span><span class="mem-back">${em}</span>`;
    c.addEventListener('click', () => flip(i));
    grid.appendChild(c);
    return c;
  });

  function updateCardEl(i) {
    const c = cardEls[i];
    const isFlipped  = flipped.includes(i) || matched_ids.has(i);
    const isMatched  = matched_ids.has(i);
    c.className = 'mem-card'
      + (isFlipped  ? ' flipped'  : '')
      + (isMatched  ? ' matched'  : '');
    c.setAttribute('aria-label',`カード${i+1}${isFlipped?`：${cards[i]}`:''}${isMatched?'（そろった）':''}`);
  }

  function flip(i) {
    if (locked || flipped.includes(i) || matched_ids.has(i)) return;
    flipped.push(i);
    updateCardEl(i);

    if (flipped.length === 2) {
      moves++;
      document.getElementById('mem-status').textContent = `手数: ${moves} | ペア: ${matched}/${pairs}`;
      locked = true;
      gameDelay(() => {
        if (cards[flipped[0]] === cards[flipped[1]]) {
          matched_ids.add(flipped[0]);
          matched_ids.add(flipped[1]);
          matched++;
          updateCardEl(flipped[0]);
          updateCardEl(flipped[1]);
          document.getElementById('mem-status').textContent = `手数: ${moves} | ペア: ${matched}/${pairs}`;

          if (matched === pairs) {
            locked = true; // 以降の操作を止める
            const score = Math.max(50, pairs * 40 - 20 - moves * 10);
            recordWin('memory', score);
            document.getElementById('mem-result').innerHTML = `
              <div class="result-box" style="margin-top:16px">
                <div class="result-score">🎉 クリア！</div>
                <p>${moves}手でクリア！</p>
                <div style="font-size:22px;font-weight:900;color:var(--accent2);margin-top:6px">スコア ${score}</div>
                ${xpResultHtml(score,'memory')}
                <button class="btn mt" onclick="startGame('memory')">もう一度</button>
                <button class="btn btn-sm mt" style="margin-left:8px" onclick="goHome()">ホームへ</button>
              </div>`;
            flipped = [];
            return;
          }
        } else {
          // ペアが違う → 裏に戻す
          cardEls[flipped[0]].className = 'mem-card';
          cardEls[flipped[1]].className = 'mem-card';
        }
        flipped = [];
        locked = false;
      }, 700);
    }
  }
  }
};
