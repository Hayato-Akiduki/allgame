
// ================================================================
// GAME 15: SPACE SHOOTER (シューティングゲーム)(gemini)
// ================================================================
// キーボード入力の状態を保持（画面外でもエラーにならないようグローバル配置）
const shootKeys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false };
let shootRAF=null;
// WASD works the same as the arrow keys.
const SHOOT_KEY_ALIAS = { w: 'ArrowUp', a: 'ArrowLeft', s: 'ArrowDown', d: 'ArrowRight' };
const shootKeyName = e => SHOOT_KEY_ALIAS[e.key.toLowerCase()] || e.key;
document.addEventListener('keydown', e => {
  if (!document.getElementById('shoot-canvas') || e.ctrlKey || e.metaKey || e.altKey) return; // ゲーム画面外なら無視
  const k = shootKeyName(e);
  if (shootKeys.hasOwnProperty(k)) { shootKeys[k] = true; e.preventDefault(); }
});
document.addEventListener('keyup', e => {
  if (!document.getElementById('shoot-canvas')) return;
  const k = shootKeyName(e);
  if (shootKeys.hasOwnProperty(k)) shootKeys[k] = false;
});
window.addEventListener('blur', () => { for (const k in shootKeys) shootKeys[k] = false; });

games.shooting = function(el) {
  const W = 360, H = 480;
  let canvas, ctx, player, bullets, enemies, particles, score, frame, gameOver;
  
  function init() {
    player = { x: W/2 - 15, y: H - 50, w: 30, h: 30, speed: 5 };
    bullets = []; enemies = []; particles = [];
    score = 0; frame = 0; gameOver = false;
    for(let k in shootKeys) shootKeys[k] = false; // 入力リセット
  }

  function spawnEnemy() {
    enemies.push({ x: Math.random() * (W - 24), y: -30, w: 24, h: 24, hp: 1 + Math.floor(score/20), speed: 1.5 + Math.random() + score/100 });
  }

  function addParticle(x, y, color) {
    for(let i=0; i<8; i++) particles.push({ x, y, vx: (Math.random()-0.5)*4, vy: (Math.random()-0.5)*4, life: 1, color });
  }

  function tick() {
    if (!document.getElementById('shoot-canvas')) return; // ホーム画面に戻ったら安全に停止
    if (gameOver) return;
    frame++;

    // プレイヤー移動（PC）
    if(shootKeys.ArrowLeft) player.x = Math.max(0, player.x - player.speed);
    if(shootKeys.ArrowRight) player.x = Math.min(W - player.w, player.x + player.speed);
    if(shootKeys.ArrowUp) player.y = Math.max(0, player.y - player.speed);
    if(shootKeys.ArrowDown) player.y = Math.min(H - player.h, player.y + player.speed);

    // オートエイム＆ショット
    if(frame % 10 === 0) {
      bullets.push({ x: player.x + player.w/2 - 3, y: player.y, w: 6, h: 12, speed: -8 });
    }

    // 弾の移動
    bullets.forEach(b => b.y += b.speed);
    bullets = bullets.filter(b => b.y > -20);

    // 敵の出現と移動
    if(frame % Math.max(20, 60 - Math.floor(score/5)) === 0) spawnEnemy();
    enemies.forEach(e => e.y += e.speed);

    // 当たり判定 (弾 vs 敵)
    bullets.forEach(b => {
      enemies.forEach(e => {
        if(b.y > 0 && e.hp > 0 && b.x < e.x + e.w && b.x + b.w > e.x && b.y < e.y + e.h && b.y + b.h > e.y) {
          b.y = -100; // 弾を消す
          e.hp--;
          addParticle(b.x, b.y, '#ffd93d');
          if(e.hp <= 0) { score++; addParticle(e.x+e.w/2, e.y+e.h/2, '#ff6b6b'); }
        }
      });
    });
    enemies = enemies.filter(e => e.hp > 0 && e.y < H + 30);

    // 当たり判定 (プレイヤー vs 敵)
    for(let e of enemies) {
      if(player.x < e.x + e.w - 5 && player.x + player.w > e.x + 5 && player.y < e.y + e.h - 5 && player.y + player.h > e.y + 5) {
        gameOver = true;
        const pt = score * 5; // 1キル5pt
        if (pt > 0) recordWin('shooting', pt); else recordLoss(0,'shooting');
        draw();
        el.innerHTML += `<div class="result-box" style="margin-top:10px"><div class="result-score">${score} Kills</div><p>スコア: ${pt}</p>${xpResultHtml(pt,'shooting')}<button class="btn mt" onclick="startGame('shooting')">もう一度</button></div>`;
        return;
      }
    }

    // パーティクル更新
    particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.05; });
    particles = particles.filter(p => p.life > 0);

    draw();
    shootRAF=requestAnimationFrame(tick);
  }

  function draw() {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0b0a24'); bg.addColorStop(0.55, '#1c1240'); bg.addColorStop(1, '#2a0f3a');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const neb = ctx.createRadialGradient(W * 0.75, H * 0.3, 10, W * 0.75, H * 0.3, 220);
    neb.addColorStop(0, 'rgba(160,90,255,.22)'); neb.addColorStop(1, 'rgba(160,90,255,0)');
    ctx.fillStyle = neb; ctx.fillRect(0, 0, W, H);
    const neb2 = ctx.createRadialGradient(W * 0.2, H * 0.75, 10, W * 0.2, H * 0.75, 200);
    neb2.addColorStop(0, 'rgba(60,170,255,.16)'); neb2.addColorStop(1, 'rgba(60,170,255,0)');
    ctx.fillStyle = neb2; ctx.fillRect(0, 0, W, H);
    // three layers of stars scrolling at different speeds
    [[18, 0.6, 1, .35], [12, 1.4, 1.6, .6], [7, 3, 2.2, .9]].forEach(([n, sp, r, a], layer) => {
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      for (let i = 0; i < n; i++) { const x = (i * 97 + layer * 41) % W, y = (i * 61 + layer * 133 + frame * sp) % H; ctx.beginPath(); ctx.arc(x, y, r * 0.6, 0, Math.PI * 2); ctx.fill(); }
    });
    // bullets: glowing lasers
    bullets.forEach(b => {
      ctx.fillStyle = 'rgba(255,220,90,.35)'; ctx.beginPath(); ctx.roundRect(b.x - 3, b.y - 3, b.w + 6, b.h + 8, 6); ctx.fill();
      const g = ctx.createLinearGradient(0, b.y, 0, b.y + b.h); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#ffc93d');
      ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 3); ctx.fill();
    });
    // enemies: saucers, tougher ones are purple
    enemies.forEach(e => {
      const cx = e.x + e.w / 2, cy = e.y + e.h / 2, tough = e.hp > 1;
      const body = tough ? ['#c084fc', '#7c3aed'] : ['#ff8a8a', '#d9364a'];
      ctx.fillStyle = 'rgba(150,240,255,.55)'; ctx.beginPath(); ctx.ellipse(cx, cy - 3, 7, 7, 0, Math.PI, 0); ctx.fill();
      const g = ctx.createLinearGradient(0, cy - 4, 0, cy + 8); g.addColorStop(0, body[0]); g.addColorStop(1, body[1]);
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy + 2, e.w / 2 + 3, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff6b0'; for (let i = -1; i <= 1; i++) { if ((Math.floor(frame / 8) + i) % 2 === 0) { ctx.beginPath(); ctx.arc(cx + i * 8, cy + 3, 1.8, 0, Math.PI * 2); ctx.fill(); } }
      ctx.fillStyle = '#1d1430'; ctx.beginPath(); ctx.arc(cx - 3, cy - 4, 1.6, 0, Math.PI * 2); ctx.arc(cx + 3, cy - 4, 1.6, 0, Math.PI * 2); ctx.fill();
      if (e.hp > 1) { ctx.fillStyle = '#fff'; for (let i = 0; i < Math.min(e.hp, 5); i++) ctx.fillRect(cx - e.hp * 3 + i * 6 + 1, e.y - 6, 4, 3); }
    });
    // player ship
    const px = player.x + player.w / 2, py = player.y, flame = 6 + Math.random() * 6;
    const fl = ctx.createLinearGradient(0, py + 26, 0, py + 30 + flame);
    fl.addColorStop(0, '#fff7c2'); fl.addColorStop(0.5, '#ffb347'); fl.addColorStop(1, 'rgba(255,90,60,0)');
    ctx.fillStyle = fl; ctx.beginPath(); ctx.moveTo(px - 6, py + 26); ctx.lineTo(px + 6, py + 26); ctx.lineTo(px, py + 32 + flame); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2f6fe0'; ctx.beginPath(); ctx.moveTo(px, py + 8); ctx.lineTo(px + 16, py + 26); ctx.lineTo(px + 6, py + 24); ctx.lineTo(px - 6, py + 24); ctx.lineTo(px - 16, py + 26); ctx.closePath(); ctx.fill();
    const hull = ctx.createLinearGradient(px - 8, 0, px + 8, 0); hull.addColorStop(0, '#9cc4ff'); hull.addColorStop(0.5, '#ffffff'); hull.addColorStop(1, '#7aa8ff');
    ctx.fillStyle = hull; ctx.beginPath(); ctx.moveTo(px, py - 2); ctx.quadraticCurveTo(px + 9, py + 10, px + 7, py + 27); ctx.lineTo(px - 7, py + 27); ctx.quadraticCurveTo(px - 9, py + 10, px, py - 2); ctx.fill();
    ctx.fillStyle = '#4fd1ff'; ctx.beginPath(); ctx.ellipse(px, py + 11, 3.5, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff5a5a'; ctx.fillRect(px - 17, py + 23, 4, 4); ctx.fillRect(px + 13, py + 23, 4, 4);
    // explosions
    particles.forEach(p => {
      ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, 2 + p.life * 3, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.font = '900 15px sans-serif'; const text = `👾 ${score}`, tw = ctx.measureText(text).width;
    ctx.fillStyle = 'rgba(10,8,30,.6)'; ctx.beginPath(); ctx.roundRect(10, 10, tw + 20, 26, 13); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.fillText(text, 20, 28);
  }

  el.innerHTML = `
    <div class="game-header"><h2>🛸 スペースシューター</h2><p>迫り来る敵を撃ち落とせ！（PCは矢印キー／WASD・マウス、スマホはドラッグ）</p></div>
    <canvas id="shoot-canvas" width="${W}" height="${H}" style="display:block;margin:0 auto;border-radius:18px;background:#0b0a24;width:100%;max-width:420px;height:auto;touch-action:none;cursor:crosshair"></canvas>
  `;
  canvas = document.getElementById('shoot-canvas');
  ctx = canvas.getContext('2d');

  // スマホ・マウスでの操作制御
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width, scaleY = H / rect.height;
    player.x = Math.max(0, Math.min(W - player.w, (e.touches[0].clientX - rect.left) * scaleX - player.w/2));
    player.y = Math.max(0, Math.min(H - player.h, (e.touches[0].clientY - rect.top) * scaleY - player.h/2));
  }, {passive: false});

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width, scaleY = H / rect.height;
    player.x = Math.max(0, Math.min(W - player.w, (e.clientX - rect.left) * scaleX - player.w/2));
    player.y = Math.max(0, Math.min(H - player.h, (e.clientY - rect.top) * scaleY - player.h/2));
  });

  init();
  shootRAF=requestAnimationFrame(tick);
  el._cleanup=()=>{gameOver=true;cancelAnimationFrame(shootRAF);for(const k in shootKeys)shootKeys[k]=false;};
};
