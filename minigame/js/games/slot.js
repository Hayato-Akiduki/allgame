




// ================================================================
// GAME: SLOT (スロット) ── リールを1つずつ手動で止める
// ================================================================
games.slot = function(el) {
  const SYMBOLS = [
    { s:'🍒', name:'チェリー',  w:30, mult:2  },
    { s:'🍋', name:'レモン',    w:25, mult:3  },
    { s:'🍊', name:'オレンジ',  w:20, mult:4  },
    { s:'🍇', name:'ぶどう',    w:15, mult:6  },
    { s:'⭐', name:'スター',    w:7,  mult:10 },
    { s:'💎', name:'ダイヤ',    w:2,  mult:20 },
    { s:'7️⃣', name:'セブン',   w:1,  mult:50 },
  ];
  const totalW = SYMBOLS.reduce((a,s)=>a+s.w, 0);
  function pickSymbol() {
    let r = Math.random() * totalW;
    for (const s of SYMBOLS) { r -= s.w; if (r <= 0) return s; }
    return SYMBOLS[0];
  }

  // 各リールの状態
  // state: 'idle' | 'spinning' | 'stopped'
  let reelState   = ['idle','idle','idle'];
  let reelSymbols = [
    [SYMBOLS[0],SYMBOLS[1],SYMBOLS[2]],
    [SYMBOLS[0],SYMBOLS[1],SYMBOLS[2]],
    [SYMBOLS[0],SYMBOLS[1],SYMBOLS[2]],
  ];
  // 止まった時の確定シンボル（中段）
  let reelResult  = [null, null, null];
  let slotRAF     = null;
  let bet = 0, spinCount = 0, gamePhase = 'bet'; // 'bet'|'spinning'|'result'

  function calcPayout(r) {
    if (r[0].s===r[1].s && r[1].s===r[2].s)
      return { mult: r[0].mult*3, line:`🎯 ${r[0].name} 3つ揃い！`, color:'var(--accent2)' };
    if (r[0].s===r[2].s)
      return { mult: r[0].mult,   line:`✨ 両端揃い (${r[0].name})`, color:'var(--accent3)' };
    if (r[0].s==='🍒')
      return { mult: 1,           line:'🍒 チェリー',                color:'var(--accent3)' };
    return   { mult: 0,           line:'はずれ...',                   color:'var(--text2)'   };
  }

  // アニメーションループ
  let animTick = 0;
  function animate() {
    animTick++;
    reelSymbols = reelSymbols.map((reel, ri) => {
      if (reelState[ri] !== 'spinning') return reel;
      // 高速スクロール：コマをシフト
      if (animTick % 3 === 0) {
        return [pickSymbol(), reel[0], reel[1]];
      }
      return reel;
    });
    renderReels();
    slotRAF = requestAnimationFrame(animate);
  }

  function startSpin() {
    if (gamePhase !== 'bet') return;
    if (bet <= 0)                   { showMsg('ベットしてください','var(--accent1)'); return; }
    if (saveData.totalScore < bet)  { showMsg('ポイントが足りません！','var(--accent1)'); return; }

    saveData.totalScore -= bet; trackCasinoBet('slot',bet);
    persistSave(); updateUI(); updateHUD();
    spinCount++;
    gamePhase = 'spinning';
    reelState   = ['spinning','spinning','spinning'];
    reelResult  = [null,null,null];
    showMsg('🎰 リールを止めよう！','var(--text2)');
    updateStopBtns();
    cancelAnimationFrame(slotRAF);
    animTick = 0;
    slotRAF = requestAnimationFrame(animate);
  }

  function stopReel(ri) {
    if (gamePhase !== 'spinning') return;
    if (reelState[ri] !== 'spinning') return;
    // 確定シンボルを決定
    reelResult[ri]  = pickSymbol();
    reelState[ri]   = 'stopped';
    // 中段を確定シンボルに固定
    reelSymbols[ri] = [
      pickSymbol(),        // 上段（飾り）
      reelResult[ri],      // 中段（確定）
      pickSymbol(),        // 下段（飾り）
    ];
    renderReels();
    updateStopBtns();

    // 全リール停止チェック
    if (reelState.every(s=>s==='stopped')) {
      cancelAnimationFrame(slotRAF);
      gamePhase = 'result';
      gameDelay(() => judgeResult(),300);
    } else {
      showMsg(`リール${ri+1} 停止！ 残り${reelState.filter(s=>s==='spinning').length}つ`, 'var(--text2)');
    }
  }

  function judgeResult() {
    const pay = calcPayout(reelResult);
    const win = Math.round(bet * pay.mult);
    if (win > bet) {
      recordWin('slot', win);
      showMsg(`${pay.line}　+${win} pt (×${pay.mult})`, pay.color);
    } else if(win>0) {
      addScore(win,'slot');recordLoss(win,'slot');
      showMsg(`${pay.line}　${win} pt戻りました`,pay.color);
    } else {
      recordLoss(0,'slot');
      showMsg(pay.line, pay.color);
    }
    persistSave(); updateUI(); updateHUD();
    bet = 0;
    gamePhase = 'bet';
    reelState = ['idle','idle','idle'];
    updateStopBtns();
    renderBet();
    renderReels(true);
  }

  function showMsg(txt, color) {
    const e = document.getElementById('slot-msg');
    if (e) { e.textContent = txt; e.style.color = color; }
  }

  function updateStopBtns() {
    [0,1,2].forEach(ri => {
      const btn = document.getElementById(`stop-btn-${ri}`);
      if (!btn) return;
      const isSpinning = reelState[ri]==='spinning';
      btn.disabled   = !isSpinning;
      btn.style.opacity    = isSpinning ? '1' : '0.35';
      btn.style.background = isSpinning ? 'var(--accent1)' : 'var(--surface2)';
      btn.textContent = reelState[ri]==='stopped' ? '✅ 停止済' : '⏹ STOP';
    });
    const spinBtn = document.getElementById('slot-spin-btn');
    if (spinBtn) {
      spinBtn.disabled = gamePhase !== 'bet';
      spinBtn.style.opacity = gamePhase === 'bet' ? '1' : '0.4';
    }
  }

  function renderReels(final=false) {
    reelSymbols.forEach((reel, ri) => {
      const col = document.getElementById(`reel-${ri}`);
      if (!col) return;
      const stopped = reelState[ri]==='stopped'||reelState[ri]==='idle';
      col.style.borderColor = stopped ? 'var(--accent3)' : 'var(--accent4)';
      col.innerHTML = reel.map((s, si) => `
        <div style="
          font-size:${si===1?'42px':'26px'};
          opacity:${si===1?'1':'0.28'};
          line-height:1.2;text-align:center;
          ${si===1&&stopped?'filter:drop-shadow(0 0 6px gold)':''}
        ">${s.s}</div>
      `).join('');
    });
  }

  function updateHUD() {
    const ptEl  = document.getElementById('slot-pt-val');
    const betEl = document.getElementById('slot-bet-val');
    const cntEl = document.getElementById('slot-cnt-val');
    if (ptEl)  ptEl.textContent  = saveData.totalScore.toLocaleString();
    if (betEl) betEl.textContent = bet;
    if (cntEl) cntEl.textContent = spinCount;
  }

  function renderBet() {
    const pt = saveData.totalScore;
    updateHUD();
    const chipRow = document.getElementById('slot-chips');
    if (!chipRow) return;
    const pcts=[1,5,10,25], colors=['#4d96ff','#6bcb77','#ffd93d','#ff6b6b'];
    chipRow.innerHTML = pcts.map((p,i)=>{
      const n = Math.max(1, Math.round(pt*p/100));
      return `<div class="chip" role="button" tabindex="0" data-nav aria-label="${n}ptを賭ける" style="background:${colors[i]};color:#111;flex-direction:column;gap:1px;cursor:pointer" onclick="slotAddBet(${n})">
        <span>${n}</span><span style="font-size:9px">${p}%</span></div>`;
    }).join('') + `<div class="chip" role="button" tabindex="0" data-nav aria-label="ベットをリセット" style="background:var(--surface2);flex-direction:column;cursor:pointer" onclick="slotClearBet()">
      <span>✕</span><span style="font-size:9px">リセット</span></div>`;
  }

  el.innerHTML = `
    <div class="game-header"><h2>🎰 スロット</h2><p>スピン後、STOPボタンで1リールずつ止めよう！</p></div>
    <!-- 配当表 -->
    <div style="background:var(--surface2);border-radius:var(--radius);padding:8px 12px;margin-bottom:12px;font-size:11px">
      <div style="font-weight:700;color:var(--text2);margin-bottom:4px">📋 配当（ベット倍率）</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px">
        ${SYMBOLS.map(s=>`<span style="background:var(--surface);padding:2px 7px;border-radius:6px">${s.s}×3→<strong style="color:var(--accent2)">×${s.mult*3}</strong></span>`).join('')}
        <span style="background:var(--surface);padding:2px 7px;border-radius:6px">両端→<strong style="color:var(--accent3)">×配当</strong></span>
        <span style="background:var(--surface);padding:2px 7px;border-radius:6px">🍒左端→<strong style="color:var(--accent3)">×1</strong></span>
      </div>
    </div>
    <!-- リール -->
    <div style="display:flex;gap:8px;justify-content:center;margin-bottom:6px">
      ${[0,1,2].map(i=>`
        <div style="background:var(--surface2);border-radius:14px;padding:10px 6px;width:88px;
          border:3px solid var(--surface2);display:flex;flex-direction:column;align-items:center;gap:3px;transition:border-color 0.2s" id="reel-${i}">
          <div style="font-size:26px;opacity:0.28;line-height:1.2;text-align:center">🎰</div>
          <div style="font-size:42px;line-height:1.2;text-align:center">🎰</div>
          <div style="font-size:26px;opacity:0.28;line-height:1.2;text-align:center">🎰</div>
        </div>`).join('')}
    </div>
    <!-- STOPボタン -->
    <div style="display:flex;gap:8px;justify-content:center;margin-bottom:8px">
      ${[0,1,2].map(i=>`
        <button id="stop-btn-${i}" disabled onclick="slotStop(${i})"
          style="width:88px;padding:8px 0;border:none;border-radius:10px;background:var(--surface2);
                 color:var(--text);font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;opacity:0.35;transition:all 0.15s">
          ⏹ STOP
        </button>`).join('')}
    </div>
    <div style="text-align:center;margin-bottom:4px">
      <span style="font-size:11px;color:var(--accent2);font-weight:700">━━━ 中段が有効ライン ━━━</span>
    </div>
    <div id="slot-msg" style="text-align:center;font-size:16px;font-weight:900;min-height:26px;margin-bottom:10px"></div>
    <!-- HUD -->
    <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap">
      <div class="info-box"><div class="ib-val" id="slot-pt-val">${saveData.totalScore.toLocaleString()}</div><div class="ib-label">💰 所持pt</div></div>
      <div class="info-box"><div class="ib-val" id="slot-bet-val">0</div><div class="ib-label">🎯 ベット</div></div>
      <div class="info-box"><div class="ib-val" id="slot-cnt-val">0</div><div class="ib-label">🎰 回数</div></div>
    </div>
    <div class="chip-row" id="slot-chips" data-nav-group="slot-chips" style="margin-bottom:10px;flex-wrap:wrap"></div>
    <div style="display:flex;gap:8px;margin-bottom:12px;align-items:center;flex-wrap:wrap">
      <input id="slot-custom" type="number" min="1" placeholder="カスタムベット..."
        style="background:var(--surface2);border:2px solid var(--surface2);border-radius:var(--radius);
               padding:10px 14px;color:var(--text);font-family:inherit;font-size:14px;width:160px;outline:none"
        onfocus="this.style.borderColor='var(--accent4)'" onblur="this.style.borderColor='var(--surface2)'">
      <button class="btn btn-sm" onclick="slotCustomBet()">入力</button>
    </div>
    <button id="slot-spin-btn" class="btn btn-warn" style="width:100%;font-size:20px;padding:14px" onclick="slotSpin()">🎰 スピン！</button>
    <p style="text-align:center;color:var(--text2);font-size:11px;margin-top:8px">セブン3つ揃いで ×150倍！タイミングよくSTOPを押そう</p>
    <p class="kbd-hint center"><kbd>Space</kbd> でスピン／左から順にSTOP、<kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> で各リールをSTOP</p>
  `;

  renderReels(); renderBet(); updateStopBtns();

  window.slotSpin      = startSpin;
  window.slotStop      = stopReel;
  onGameKey((key,e)=>{
    const reel=['1','2','3'].indexOf(key);
    if(reel>=0){stopReel(reel);return true;}
    if(key!==' '&&key!=='Enter')return false;
    if(e.repeat)return true;
    if(gamePhase==='spinning'){const next=reelState.indexOf('spinning');if(next>=0)stopReel(next);}else startSpin();
    return true;
  });
  window.slotAddBet    = n => { if(saveData.totalScore>=bet+n){bet+=n;renderBet();}else showMsg('ポイントが足りません','var(--accent1)'); };
  window.slotClearBet  = ()=>{ bet=0; renderBet(); };
  window.slotCustomBet = ()=>{
    const v=parseInt(document.getElementById('slot-custom')?.value);
    if(v>0&&v<=saveData.totalScore){bet=v;renderBet();}
    else showMsg(`1〜${saveData.totalScore} で入力してください`,'var(--accent1)');
  };

  // ゲーム離脱時にRAFをキャンセル
  el._slotCleanup = ()=>cancelAnimationFrame(slotRAF);
};
