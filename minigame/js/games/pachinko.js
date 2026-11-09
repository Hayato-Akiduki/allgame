
// ================================================================
// GAME: PACHINKO (パチンコ)
// ================================================================
games.pachinko = function(el) {
  const W = 360, H = 500;
  let canvas, ctx;
  let balls = [], pegs = [], pockets = [], particles2 = [];
  let ballCount = 0, totalWin = 0, bet = 0, shooting = false;
  let pachinkoRAF2 = null;

  // デジタル抽選
  let digital = { spinning: false, nums: [0,0,0], display: [0,0,0], timer: null, hit: false };

  // ポケット設定（倍率）
  // 期待値を約0.7に設定（7割返し）
  // 左右端: ×0 (没収)、その隣: ×0.5、中寄り: ×1.5、中央2つ: ×3
  const POCKET_DEFS = [
    { mult:0,   label:'OUT',  color:'#333' },
    { mult:0.5, label:'×0.5', color:'#4d96ff' },
    { mult:1.5, label:'×1.5', color:'#6bcb77' },
    { mult:3,   label:'×3',   color:'#ffd93d' },
    { mult:3,   label:'×3',   color:'#ffd93d' },
    { mult:1.5, label:'×1.5', color:'#6bcb77' },
    { mult:0.5, label:'×0.5', color:'#4d96ff' },
    { mult:0,   label:'OUT',  color:'#333' },
  ];

  function initBoard() {
    pegs = [];
    const ROWS = 9, COLS = 8;
    for (let r = 0; r < ROWS; r++) {
      const cols = r % 2 === 0 ? COLS : COLS - 1;
      const offsetX = r % 2 === 0 ? 0 : (W / COLS) / 2;
      for (let c = 0; c < cols; c++) {
        pegs.push({
          x: offsetX + (W / COLS) * c + (W / COLS) / 2,
          y: 120 + r * 38,
        });
      }
    }
    // ポケット
    pockets = POCKET_DEFS.map((def, i) => ({
      x: (W / POCKET_DEFS.length) * i + (W / POCKET_DEFS.length) / 2,
      y: H - 30,
      w: W / POCKET_DEFS.length - 4,
      mult:  def.mult,
      label: def.label,
      color: def.color,
    }));
  }

  function shootBall() {
    if (saveData.totalScore < bet || bet <= 0) return;
    if (ballCount >= 5) return; // 同時5球まで
    saveData.totalScore -= bet; trackCasinoBet('pachinko',bet);
    persistSave(); updateUI(); updateHUD();
    balls.push({
      x: W / 2 + (Math.random() - 0.5) * 60,
      y: 30,
      vx: (Math.random() - 0.5) * 2,
      vy: 2,
      r: 7,
      active: true,
    });
    ballCount++;

    // デジタル抽選開始（30%で大当たり）
    if (!digital.spinning) startDigital(Math.random() < 0.3);
  }

  function startDigital(hit) {
    digital.spinning = true;
    digital.hit = hit;
    digital.display = [0,0,0];
    let tick2 = 0;
    clearInterval(digital.timer);
    digital.timer = setInterval(() => {
      tick2++;
      digital.display = [
        Math.floor(Math.random()*10),
        Math.floor(Math.random()*10),
        tick2 > 30 ? (hit ? digital.nums[1] : Math.floor(Math.random()*10)) : Math.floor(Math.random()*10),
      ];
      if (tick2 > 40) {
        const hitNum = Math.floor(Math.random()*10);
        digital.display = hit ? [hitNum,hitNum,hitNum] : (() => {
          let a=Math.floor(Math.random()*10),b,c;
          do{b=Math.floor(Math.random()*10);}while(b===a);
          do{c=Math.floor(Math.random()*10);}while(c===a&&c===b);
          return [a,b,c];
        })();
        digital.spinning = false;
        clearInterval(digital.timer);
        if (hit) triggerJackpot();
      }
    }, 80);
  }

  function triggerJackpot() {
    // 大当たり：ポイントを大量付与
    const jackpot = bet * 100;
    totalWin += jackpot;
    recordWin('pachinko', jackpot);
    persistSave(); updateUI(); updateHUD();
    // パーティクル爆発
    for (let i = 0; i < 40; i++) {
      particles2.push({
        x: W/2, y: H/2,
        vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8,
        life: 1, color: ['#ffd93d','#ff6b6b','#6bcb77','#c77dff','#4d96ff'][Math.floor(Math.random()*5)],
        r: 4+Math.random()*4,
      });
    }
    showMsg('🎊 大当たり！ +' + jackpot + 'pt', 'var(--accent2)');
  }

  function showMsg(txt, color) {
    const el2 = document.getElementById('pachi-msg');
    if (el2) { el2.textContent = txt; el2.style.color = color || 'var(--text)'; }
  }

  function updateHUD() {
    const ptEl = document.getElementById('pachi-pt');
    const winEl = document.getElementById('pachi-win');
    const betEl = document.getElementById('pachi-bet');
    if (ptEl)  ptEl.textContent  = saveData.totalScore.toLocaleString();
    if (winEl) winEl.textContent = totalWin.toLocaleString();
    if (betEl) betEl.textContent = bet;
  }

  function tick3() {
    ctx.clearRect(0, 0, W, H);

    // 背景
    ctx.fillStyle = '#0f0e17'; ctx.fillRect(0,0,W,H);

    // デジタル表示エリア
    ctx.fillStyle = '#1a1828';
    ctx.beginPath(); ctx.roundRect(W/2-70, 10, 140, 80, 10); ctx.fill();
    ctx.strokeStyle = digital.spinning ? '#ffd93d' : digital.hit ? '#ff6b6b' : '#252336';
    ctx.lineWidth = 2; ctx.stroke();
    ctx.font = 'bold 36px monospace'; ctx.textAlign = 'center';
    digital.display.forEach((n, i) => {
      const allSame = digital.display[0]===digital.display[1] && digital.display[1]===digital.display[2];
      ctx.fillStyle = !digital.spinning && allSame ? '#ffd93d' : '#fffffe';
      ctx.fillText(n, W/2 - 38 + i*38, 65);
    });
    ctx.font = 'bold 10px sans-serif'; ctx.fillStyle = '#a7a9be';
    ctx.fillText('DIGITAL', W/2, 100);

    // くぎ（ペグ）
    pegs.forEach(p => {
      ctx.fillStyle = '#a7a9be';
      ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2); ctx.fill();
    });

    // ポケット
    pockets.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.roundRect(p.x - p.w/2, p.y-18, p.w, 22, 4); ctx.fill();
      ctx.fillStyle = p.mult >= 1.5 ? '#111' : '#aaa';
      ctx.font = 'bold 10px sans-serif'; ctx.textAlign='center';
      ctx.fillText(p.label, p.x, p.y-2);
    });

    // 玉の物理演算
    balls.forEach(b => {
      if (!b.active) return;
      b.vy += 0.18; // 重力
      b.x += b.vx; b.y += b.vy;
      // 壁
      if (b.x - b.r < 0) { b.x = b.r; b.vx = Math.abs(b.vx)*0.7; }
      if (b.x + b.r > W) { b.x = W-b.r; b.vx = -Math.abs(b.vx)*0.7; }
      // ペグとの当たり判定
      pegs.forEach(p => {
        const dx = b.x-p.x, dy = b.y-p.y;
        const dist = Math.sqrt(dx*dx+dy*dy);
        if (dist < b.r + 5) {
          const angle = Math.atan2(dy, dx);
          const speed = Math.sqrt(b.vx*b.vx+b.vy*b.vy);
          b.vx = Math.cos(angle) * speed * 0.8 + (Math.random()-0.5)*0.5;
          b.vy = Math.sin(angle) * speed * 0.8;
          b.x = p.x + Math.cos(angle)*(b.r+5+1);
          b.y = p.y + Math.sin(angle)*(b.r+5+1);
        }
      });
      // ポケット判定
      pockets.forEach(p => {
        if (Math.abs(b.x - p.x) < p.w/2 && b.y >= p.y-18) {
          b.active = false;
          const win = Math.round(bet * p.mult);
          totalWin += win - bet; // 差分を記録
          if (win > 0) {
            if (p.mult >= 3) recordWin('pachinko', win); else addScore(win,'pachinko');
            persistSave(); updateUI(); updateHUD();
            showMsg(`${p.label}　+${win} pt`, p.mult >= 3 ? 'var(--accent2)' : 'var(--accent3)');
          } else {
            // OUT: ベット没収（既に引かれているのでそのまま）
            recordLoss();
            showMsg('OUT… ポイント没収', 'var(--accent1)');
          }
          // パーティクル
          for (let i=0;i<8;i++) particles2.push({x:b.x,y:b.y,vx:(Math.random()-0.5)*4,vy:-Math.random()*3,life:1,color:p.color,r:3});
          ballCount = Math.max(0, ballCount-1);
          updateHUD();
        }
      });
      // 落下
      if (b.y > H+20) { b.active=false; ballCount=Math.max(0,ballCount-1); }

      // 描画
      if (b.active) {
        ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2);
        const grad = ctx.createRadialGradient(b.x-2,b.y-2,1,b.x,b.y,b.r);
        grad.addColorStop(0,'#fff'); grad.addColorStop(1,'#c0c0c0');
        ctx.fillStyle=grad; ctx.fill();
      }
    });
    balls = balls.filter(b=>b.active);

    // パーティクル
    particles2.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r*p.life, 0, Math.PI*2); ctx.fill();
      p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life -= 0.04;
    });
    particles2 = particles2.filter(p=>p.life>0);
    ctx.globalAlpha = 1;

    pachinkoRAF2 = requestAnimationFrame(tick3);
  }

  function setBet(n) {
    if (saveData.totalScore >= n) { bet = n; updateHUD(); }
    else showMsg('ポイントが足りません', 'var(--accent1)');
  }

  el.innerHTML = `
    <div class="game-header"><h2>⚪ パチンコ</h2><p>玉を打ち込んでデジタルを狙え！大当たりで×100倍</p><p class="kbd-hint"><kbd>Space</kbd>／<kbd>Enter</kbd> で発射</p></div>
    <div style="display:flex;gap:10px;margin-bottom:10px;flex-wrap:wrap">
      <div class="info-box"><div class="ib-val" id="pachi-pt">${saveData.totalScore.toLocaleString()}</div><div class="ib-label">💰 所持pt</div></div>
      <div class="info-box"><div class="ib-val" id="pachi-win">0</div><div class="ib-label">🏆 獲得pt</div></div>
      <div class="info-box"><div class="ib-val" id="pachi-bet">${bet}</div><div class="ib-label">🎯 1球ベット</div></div>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;align-items:center">
      <span style="font-size:12px;color:var(--text2)">1球のベット:</span>
      ${[1,5,10,50].map((n,i)=>`<button class="btn btn-sm" style="background:${['#4d96ff','#6bcb77','#ffd93d','#ff6b6b'][i]};color:#111" onclick="pachiBet(${n})">${n}pt</button>`).join('')}
    </div>
    <canvas id="pachi-canvas" width="${W}" height="${H}"
      style="display:block;margin:0 auto;border-radius:14px;max-width:100%;border:2px solid var(--surface2)"></canvas>
    <div id="pachi-msg" style="text-align:center;font-size:18px;font-weight:900;min-height:28px;margin-top:10px"></div>
    <div style="display:flex;gap:8px;justify-content:center;margin-top:10px;flex-wrap:wrap">
      <button class="btn btn-warn" style="font-size:18px;padding:12px 32px" onclick="pachiShoot()">⚪ 発射！</button>
      <button class="btn btn-sm" style="background:var(--surface2)" onclick="pachiAutoShoot()">🔄 連打（5球）</button>
    </div>
    <p style="text-align:center;color:var(--text2);font-size:11px;margin-top:8px">デジタルが3つ揃うと大当たり！（確率30%）</p>
  `;

  canvas = document.getElementById('pachi-canvas');
  ctx = canvas.getContext('2d');
  initBoard();
  pachinkoRAF2 = requestAnimationFrame(tick3);

  // キャンバスクリックで発射
  canvas.addEventListener('click', () => shootBall());

  window.pachiShoot = shootBall;
  onGameKey((key,e)=>{if(key!==' '&&key!=='Enter')return false;if(!e.repeat)shootBall();return true;});
  window.pachiBet = setBet;
  window.pachiAutoShoot = () => {
    let count = 0;
    const iv = setInterval(() => {
      if (count >= 5 || saveData.totalScore < bet || bet <= 0) { clearInterval(iv); return; }
      shootBall(); count++;
    }, 400);
  };

  // cleanup
  el._cleanup = () => {
    cancelAnimationFrame(pachinkoRAF2);
    clearInterval(digital.timer);
  };
};
