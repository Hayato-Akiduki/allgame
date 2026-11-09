
// ================================================================
// GAME: AIM TRAINER (エイム練習)
// ================================================================
let aimRAF = null;
games.aimtrainer = function(el) {
  const W = 480, H = 380;
  let canvas, ctx;

  // モード定義
  const MODES = [
    { id:'precision', name:'プレシジョン', desc:'大きめのターゲット。確実に当てる練習', icon:'🎯',
      targetR: 34, moveSpeed: 0, spawnInterval: 900, timeLimit: 30, color:'#ff6b6b' },
    { id:'speed',     name:'スピード',    desc:'小さく速いターゲット。素早さ重視',     icon:'⚡',
      targetR: 20, moveSpeed: 2.2, spawnInterval: 600, timeLimit: 30, color:'#ffd93d' },
    { id:'flick',     name:'フリック',    desc:'一瞬だけ現れる瞬間ターゲット',         icon:'💥',
      targetR: 28, moveSpeed: 0, spawnInterval: 500, timeLimit: 30, color:'#c77dff' },
    { id:'tracking',  name:'トラッキング',desc:'動き続けるターゲットを追い続けろ',     icon:'👁',
      targetR: 26, moveSpeed: 3.5, spawnInterval: 2000, timeLimit: 20, color:'#4d96ff' },
  ];

  let selectedMode = null;
  let gamePhase = 'menu'; // menu | playing | result

  // ゲーム変数
  let targets = [], shots = 0, hits = 0, misses = 0, score = 0;
  let combo = 0, maxCombo = 0, timeLeft = 0, gameTimer = null;
  let lastHitTime = 0, reactionTimes = [];
  let crossX = W/2, crossY = H/2; // クロスヘア位置

  // ── メニュー
  function renderMenu() {
    gamePhase = 'menu';
    el.innerHTML = `
      <div class="game-header"><h2>🎯 エイム練習</h2><p>モードを選んでエイム力を鍛えよう</p></div>
      <div class="aim-mode-grid" data-nav-group="aim-modes">
        ${MODES.map(m=>`
          <div class="aim-mode-card" role="button" tabindex="0" data-nav aria-label="${m.name}：${m.desc}" onclick="aimSelectMode('${m.id}')" style="--mc:${m.color}"
            onmouseover="this.style.borderColor='${m.color}'" onmouseout="this.style.borderColor='transparent'">
            <div style="font-size:28px;margin-bottom:6px">${m.icon}</div>
            <div style="font-size:15px;font-weight:700;margin-bottom:4px">${m.name}</div>
            <div style="font-size:11px;color:var(--text2);line-height:1.5">${m.desc}</div>
            <div style="margin-top:8px;font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;
              background:${m.color};color:#111;display:inline-block">${m.timeLimit}秒</div>
          </div>`).join('')}
      </div>
      <div style="background:var(--surface2);border-radius:var(--radius);padding:12px;font-size:12px;color:var(--text2)">
        💡 マウスを動かしてクロスヘアを操作、クリックでターゲットを撃つ<br>
        📱 スマホはタップで操作可能<br>
        <span class="kbd-hint">⌨️ <kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd>／<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> で照準、<kbd>Space</kbd> で撃つ（<kbd>Shift</kbd> で微調整）</span>
      </div>
      ${saveData.highscores['aimtrainer'] ? `
        <div style="margin-top:12px;text-align:center;color:var(--text2);font-size:13px">
          🏆 ハイスコア: <strong style="color:var(--accent2)">${saveData.highscores['aimtrainer'].toLocaleString()}</strong>
        </div>` : ''}
    `;
    window.aimSelectMode = (id) => {
      selectedMode = MODES.find(m=>m.id===id);
      startGame2();
    };
  }

  // ── ゲーム開始
  function startGame2() {
    gamePhase = 'playing';
    targets = []; shots = 0; hits = 0; misses = 0; score = 0;
    combo = 0; maxCombo = 0; reactionTimes = [];
    timeLeft = selectedMode.timeLimit;
    lastHitTime = Date.now();

    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:6px">
        <div style="display:flex;gap:8px">
          <div class="info-box" style="min-width:64px"><div class="ib-val" id="aim-score">0</div><div class="ib-label">スコア</div></div>
          <div class="info-box" style="min-width:64px"><div class="ib-val" id="aim-hits">0</div><div class="ib-label">ヒット</div></div>
          <div class="info-box" style="min-width:64px"><div class="ib-val" id="aim-combo" style="color:var(--accent1)">0</div><div class="ib-label">🔥コンボ</div></div>
        </div>
        <div style="text-align:center">
          <div id="aim-timer" style="font-size:32px;font-weight:900;color:var(--accent3)">${timeLeft}</div>
          <div style="font-size:10px;color:var(--text2)">${selectedMode.icon} ${selectedMode.name}</div>
        </div>
      </div>
      <canvas id="aim-canvas" width="${W}" height="${H}"
        style="display:block;margin:0 auto;border-radius:14px;cursor:none;background:#0d1117;max-width:100%;border:2px solid var(--surface2)"></canvas>
      <div id="aim-msg" style="text-align:center;font-size:14px;font-weight:700;min-height:20px;margin-top:8px;color:var(--text2)">
        クリック/タップでターゲットを撃て！
      </div>
    `;

    canvas = document.getElementById('aim-canvas');
    ctx = canvas.getContext('2d');

    // マウス操作
    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      crossX = (e.clientX - rect.left) * (W / rect.width);
      crossY = (e.clientY - rect.top)  * (H / rect.height);
    });
    canvas.addEventListener('click', e => {
      const rect = canvas.getBoundingClientRect();
      const cx = (e.clientX - rect.left) * (W / rect.width);
      const cy = (e.clientY - rect.top)  * (H / rect.height);
      fireShot(cx, cy);
    });
    // タッチ操作
    canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      crossX = (e.touches[0].clientX - rect.left) * (W / rect.width);
      crossY = (e.touches[0].clientY - rect.top)  * (H / rect.height);
    }, { passive: false });
    canvas.addEventListener('touchend', e => {
      e.preventDefault();
      const t = e.changedTouches[0];
      const rect = canvas.getBoundingClientRect();
      fireShot(
        (t.clientX - rect.left) * (W / rect.width),
        (t.clientY - rect.top)  * (H / rect.height)
      );
    }, { passive: false });

    // タイマー
    clearInterval(gameTimer);
    gameTimer = setInterval(() => {
      timeLeft--;
      const timerEl = document.getElementById('aim-timer');
      if (timerEl) {
        timerEl.textContent = timeLeft;
        timerEl.style.color = timeLeft <= 5 ? 'var(--accent1)' : timeLeft <= 10 ? 'var(--accent2)' : 'var(--accent3)';
      }
      if (timeLeft <= 0) { clearInterval(gameTimer); endGame(); }
    }, 1000);

    // ターゲット自動スポーン
    spawnTarget();
    if (selectedMode.id !== 'flick') {
      const spawnLoop = setInterval(() => {
        if (gamePhase !== 'playing') { clearInterval(spawnLoop); return; }
        if (targets.length < (selectedMode.id === 'tracking' ? 1 : 4)) spawnTarget();
      }, selectedMode.spawnInterval);
      el._aimSpawn = () => clearInterval(spawnLoop);
    }

    cancelAnimationFrame(aimRAF);
    aimRAF = requestAnimationFrame(aimLoop);
  }

  // ターゲットスポーン
  function spawnTarget() {
    const r = selectedMode.targetR;
    const margin = r + 10;
    const x = margin + Math.random() * (W - margin * 2);
    const y = margin + Math.random() * (H - margin * 2);
    let vx = 0, vy = 0;
    if (selectedMode.moveSpeed > 0) {
      const angle = Math.random() * Math.PI * 2;
      vx = Math.cos(angle) * selectedMode.moveSpeed;
      vy = Math.sin(angle) * selectedMode.moveSpeed;
    }

    const target = {
      x, y, r, vx, vy,
      spawnTime: Date.now(),
      lifeTime: selectedMode.id === 'flick' ? 600 + Math.random() * 300 : 99999,
      alpha: 1,
      hit: false,
      expired: false,   // フリック: タイムアウトしたか
      ripple: 0,
      color: selectedMode.color,
      id: Math.random(),
    };
    targets.push(target);

    // フリックモード: 一定時間後に消滅 → 次をスポーン
    if (selectedMode.id === 'flick') {
      gameDelay(() => {
        if (gamePhase !== 'playing') return;
        const idx = targets.findIndex(t2 => t2.id === target.id);
        if (idx !== -1 && !targets[idx].hit) {
          // ミス扱いで即削除
          targets.splice(idx, 1);
          misses++;
          combo = 0;
          // 次のターゲットをすぐスポーン
          spawnTarget();
        }
        // ヒット済みの場合は fireShot 側が spawnTarget() を呼ぶので何もしない
      }, target.lifeTime);
    }
  }

  // 射撃処理
  function fireShot(cx, cy) {
    if (gamePhase !== 'playing') return;
    shots++;
    let hit = false;

    // ターゲットとの当たり判定（手前から）
    for (let i = targets.length - 1; i >= 0; i--) {
      const t = targets[i];
      if (t.hit) continue;
      const dx = cx - t.x, dy = cy - t.y;
      if (Math.sqrt(dx*dx + dy*dy) <= t.r + 4) { // 少し余裕を持つ
        // ヒット！
        hit = true;
        t.hit = true;
        combo++;
        maxCombo = Math.max(maxCombo, combo);

        // スコア計算: 中心に近いほど高得点 + コンボボーナス
        const dist = Math.sqrt(dx*dx + dy*dy);
        const accuracy = Math.max(0, 1 - dist / t.r);
        const baseScore = Math.round(50 + accuracy * 50); // 50〜100
        const comboMult = 1 + Math.min(combo - 1, 9) * 0.1; // 最大×2
        const pts = Math.round(baseScore * comboMult);
        score += pts;

        // 反応時間記録
        const rt = Date.now() - lastHitTime;
        if (rt < 3000) reactionTimes.push(rt);
        lastHitTime = Date.now();

        // ヒットエフェクト
        t.ripple = 1;
        spawnHitParticles(t.x, t.y, t.color);

        // ターゲット除去＆再スポーン
        gameDelay(() => {
          targets = targets.filter(t2 => t2.id !== t.id);
          if (gamePhase === 'playing' && selectedMode.id !== 'tracking') spawnTarget();
        }, 150);

        updateHUD(pts);
        break;
      }
    }

    if (!hit) {
      // ミス
      misses++;
      combo = 0;
      // ミスフラッシュ
      spawnMissEffect(cx, cy);
      updateHUD(0);
    }
  }

  // パーティクル
  let particles3 = [];
  function spawnHitParticles(x, y, color) {
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      particles3.push({ x, y, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed, life: 1, color, r: 2+Math.random()*2 });
    }
  }
  let missEffects = [];
  function spawnMissEffect(x, y) {
    missEffects.push({ x, y, life: 1 });
  }

  function updateHUD(pts) {
    const sc = document.getElementById('aim-score');
    const ht = document.getElementById('aim-hits');
    const cb = document.getElementById('aim-combo');
    if (sc) sc.textContent = score.toLocaleString();
    if (ht) ht.textContent = hits + (pts > 0 ? 1 : 0);
    if (cb) {
      cb.textContent = combo;
      cb.style.color = combo >= 5 ? 'var(--accent1)' : combo >= 3 ? 'var(--accent2)' : 'var(--accent3)';
    }
    hits += pts > 0 ? 1 : 0;
    if (pts > 0) {
      const msg = document.getElementById('aim-msg');
      if (msg) {
        msg.textContent = combo >= 5 ? `🔥 ${combo}コンボ！ スコア +${pts}` : combo >= 2 ? `⚡ ${combo}連続 スコア +${pts}` : `スコア +${pts}`;
        msg.style.color = combo >= 5 ? 'var(--accent1)' : combo >= 2 ? 'var(--accent2)' : 'var(--text)';
      }
    }
  }

  // メインループ
  function aimLoop() {
    if (gamePhase !== 'playing') return;

    const bgG = ctx.createLinearGradient(0, 0, 0, H);
    bgG.addColorStop(0, '#16233d'); bgG.addColorStop(0.62, '#0f1a2e'); bgG.addColorStop(1, '#0a1220');
    ctx.fillStyle = bgG; ctx.fillRect(0, 0, W, H);
    // range-style perspective floor
    const horizon = H * 0.62;
    ctx.strokeStyle = 'rgba(0,255,170,0.10)'; ctx.lineWidth = 1;
    for (let i = -8; i <= 8; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * 18, horizon); ctx.lineTo(W / 2 + i * 120, H); ctx.stroke(); }
    for (let k = 1; k < 7; k++) { const y = horizon + (H - horizon) * (k * k) / 36; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    for (let gx = 0; gx < W; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, horizon); ctx.stroke(); }
    ctx.fillStyle = 'rgba(0,255,170,0.18)'; ctx.fillRect(0, horizon, W, 1.5);

    const now = Date.now();

    // ターゲット更新・描画
    targets.forEach(t => {
      if (t.alpha <= 0) return;

      // 移動
      if (!t.hit && selectedMode.moveSpeed > 0) {
        t.x += t.vx; t.y += t.vy;
        if (t.x - t.r < 0 || t.x + t.r > W) { t.vx *= -1; t.x = Math.max(t.r, Math.min(W-t.r, t.x)); }
        if (t.y - t.r < 0 || t.y + t.r > H) { t.vy *= -1; t.y = Math.max(t.r, Math.min(H-t.r, t.y)); }
      }

      // フリックモード: 残り時間で透明度（最後の20%だけフェード）
      if (selectedMode.id === 'flick') {
        const elapsed = now - t.spawnTime;
        const fadeStart = t.lifeTime * 0.8; // 残り20%からフェード開始
        if (elapsed >= fadeStart) {
          t.alpha = Math.max(0.1, 1 - (elapsed - fadeStart) / (t.lifeTime * 0.2));
        } else {
          t.alpha = 1;
        }
      }

      // ヒット後フェードアウト
      if (t.hit) { t.alpha = Math.max(0, t.alpha - 0.12); }

      ctx.globalAlpha = t.alpha;

      // 外側リング（点滅）
      const pulse = 0.7 + 0.3 * Math.sin(now * 0.006);
      ctx.beginPath(); ctx.arc(t.x, t.y, t.r + 5, 0, Math.PI*2);
      ctx.strokeStyle = t.color; ctx.lineWidth = 2 * pulse; ctx.globalAlpha = t.alpha * 0.4; ctx.stroke();

      // メインサークル
      ctx.globalAlpha = t.alpha;
      const grad = ctx.createRadialGradient(t.x-t.r*0.3, t.y-t.r*0.3, 0, t.x, t.y, t.r);
      grad.addColorStop(0, t.hit ? '#fff' : lighten(t.color));
      grad.addColorStop(1, t.hit ? 'rgba(255,255,255,0)' : t.color);
      ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI*2);
      ctx.fillStyle = grad; ctx.fill();
      // bullseye rings
      if (!t.hit) {
        [[0.72, '#ffffff'], [0.48, t.color], [0.24, '#ffffff']].forEach(([k, c]) => { ctx.beginPath(); ctx.arc(t.x, t.y, t.r * k, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); });
        ctx.beginPath(); ctx.arc(t.x, t.y, Math.max(3, t.r * 0.11), 0, Math.PI * 2); ctx.fillStyle = '#ff3b4f'; ctx.fill();
        ctx.beginPath(); ctx.arc(t.x - t.r * 0.35, t.y - t.r * 0.4, t.r * 0.18, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fill();
      }

      // ヒットリップル
      if (t.ripple > 0) {
        ctx.beginPath(); ctx.arc(t.x, t.y, t.r * (1 + (1-t.ripple)*2), 0, Math.PI*2);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.globalAlpha = t.ripple * 0.6; ctx.stroke();
        t.ripple = Math.max(0, t.ripple - 0.12);
      }
    });
    // ヒット済みでフェードアウト完了したターゲットのみ除去
    // フリックの生存中ターゲットは setTimeout 側が管理するので触らない
    targets = targets.filter(t => {
      if (t.hit) return t.alpha > 0; // ヒット済みはフェードアウト後に消す
      return true;                   // 生存中は絶対に消さない
    });

    ctx.globalAlpha = 1;

    // パーティクル
    particles3.forEach(p => {
      ctx.globalAlpha = p.life * 0.9;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI*2); ctx.fill();
      p.x += p.vx; p.y += p.vy; p.vx *= 0.9; p.vy *= 0.9; p.life -= 0.06;
    });
    particles3 = particles3.filter(p => p.life > 0);
    ctx.globalAlpha = 1;

    // ミスエフェクト
    missEffects.forEach(m => {
      ctx.strokeStyle = `rgba(255,80,80,${m.life * 0.7})`;
      ctx.lineWidth = 2;
      const s = 10 * (1 - m.life) + 6;
      ctx.beginPath(); ctx.moveTo(m.x-s,m.y-s); ctx.lineTo(m.x+s,m.y+s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(m.x+s,m.y-s); ctx.lineTo(m.x-s,m.y+s); ctx.stroke();
      m.life -= 0.08;
    });
    missEffects = missEffects.filter(m => m.life > 0);

    // キーボード照準（Shiftで微調整）
    const kx=(aimKeys.right?1:0)-(aimKeys.left?1:0),ky=(aimKeys.down?1:0)-(aimKeys.up?1:0);
    if(kx||ky){const sp=aimKeys.slow?2.5:7,len=Math.hypot(kx,ky);crossX=Math.max(0,Math.min(W,crossX+kx/len*sp));crossY=Math.max(0,Math.min(H,crossY+ky/len*sp));}

    // クロスヘア
    drawCrosshair(crossX, crossY);

    aimRAF = requestAnimationFrame(aimLoop);
  }

  function lighten(hex) {
    // 簡易ライトン
    return hex + 'cc';
  }

  function drawCrosshair(x, y) {
    const size = 12, gap = 5, thick = 2;
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = thick;
    ctx.lineCap = 'round';
    // 上下左右の線
    [[x,y-gap,x,y-gap-size],[x,y+gap,x,y+gap+size],[x-gap,y,x-gap-size,y],[x+gap,y,x+gap+size,y]].forEach(([x1,y1,x2,y2])=>{
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    });
    // 中心点
    ctx.fillStyle = '#00ff88';
    ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI*2); ctx.fill();
    // 外リング
    ctx.strokeStyle = 'rgba(0,255,136,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x, y, gap+size/2, 0, Math.PI*2); ctx.stroke();
  }

  // ゲーム終了
  function endGame() {
    gamePhase = 'result';
    cancelAnimationFrame(aimRAF);
    clearInterval(gameTimer);
    if (el._aimSpawn) { el._aimSpawn(); el._aimSpawn = null; }

    const accuracy = shots > 0 ? Math.round(hits / shots * 100) : 0;
    const avgReaction = reactionTimes.length > 0 ? Math.round(reactionTimes.reduce((a,b)=>a+b,0)/reactionTimes.length) : 0;

    // スコアランク
    const rank = score >= 3000 ? 'S+' : score >= 2000 ? 'S' : score >= 1500 ? 'A' : score >= 1000 ? 'B' : score >= 500 ? 'C' : 'D';
    const rankColor = {S:['#ffd93d','#ff9de2'],'S+':['#ff6b6b','#ffd93d'],A:['#6bcb77','#6bcb77'],B:['#4d96ff','#4d96ff'],C:['#a7a9be','#a7a9be'],D:['#555','#555']}[rank] || ['#fff','#fff'];

    if(score>0)recordWin('aimtrainer',score);else recordLoss(0,'aimtrainer');

    el.innerHTML = `
      <div class="game-header"><h2>🎯 エイム練習 結果</h2><p>${selectedMode.icon} ${selectedMode.name}モード</p></div>
      <div style="text-align:center;margin-bottom:16px">
        <div style="font-size:72px;font-weight:900;background:linear-gradient(135deg,${rankColor[0]},${rankColor[1]});
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1">${rank}</div>
        <div style="font-size:13px;color:var(--text2);margin-top:4px">ランク</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
        <div class="info-box"><div class="ib-val" style="color:var(--accent2)">${score.toLocaleString()}</div><div class="ib-label">🏆 スコア</div></div>
        <div class="info-box"><div class="ib-val" style="color:var(--accent3)">${accuracy}%</div><div class="ib-label">🎯 命中率</div></div>
        <div class="info-box"><div class="ib-val">${hits}</div><div class="ib-label">✅ ヒット数</div></div>
        <div class="info-box"><div class="ib-val" style="color:var(--accent1)">${misses}</div><div class="ib-label">❌ ミス数</div></div>
        <div class="info-box"><div class="ib-val" style="color:var(--accent1)">${maxCombo}</div><div class="ib-label">🔥 最大コンボ</div></div>
        <div class="info-box"><div class="ib-val">${avgReaction > 0 ? avgReaction+'ms' : '-'}</div><div class="ib-label">⚡ 平均反応</div></div>
      </div>
      ${xpResultHtml(score,'aimtrainer')}
      <div style="background:var(--surface2);border-radius:var(--radius);padding:12px;margin:12px 0;font-size:13px;color:var(--text2)">
        ${accuracy >= 80 ? '🔥 素晴らしい命中率！エイムが安定しています' :
          accuracy >= 60 ? '👍 悪くない！もう少し丁寧に狙おう' :
          maxCombo >= 5  ? '⚡ コンボは出てるけど命中率を上げよう' :
          '💪 練習あるのみ！繰り返すことでエイムは必ず上がる'}
      </div>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
        <button class="btn btn-warn" onclick="aimRetry()">🔄 もう一度</button>
        <button class="btn btn-sm" style="background:var(--surface2)" onclick="aimMenu()">モード選択に戻る</button>
        <button class="btn btn-sm" style="background:var(--surface2)" onclick="goHome()">ホームへ</button>
      </div>
    `;

    window.aimRetry = () => startGame2();
    window.aimMenu  = () => renderMenu();
  }

  const aimKeys=heldKeys({left:['ArrowLeft','a'],right:['ArrowRight','d'],up:['ArrowUp','w'],down:['ArrowDown','s'],slow:['Shift']},{when:()=>gamePhase==='playing'});
  onGameKey((key,e)=>{if(gamePhase!=='playing'||(key!==' '&&key!=='Enter'))return false;if(!e.repeat)fireShot(crossX,crossY);return true;});
  renderMenu();

  el._aimCleanup = () => {
    cancelAnimationFrame(aimRAF);
    clearInterval(gameTimer);
    if (el._aimSpawn) { el._aimSpawn(); el._aimSpawn = null; }
    particles3 = []; missEffects = [];
  };
};
