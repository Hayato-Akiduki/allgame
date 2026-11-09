
// ================================================================
// GAME 13: RUNNER (横スクロールランナー)
// ================================================================
let runnerRAF = null;
games.runner = function(el) {
  const W = 480, H = 300;
  const GROUND = H - 84;
  const GRAVITY = 0.55, JUMP_V = -12, RUN_SPD_INIT = 4;

  let canvas, ctx;
  let player, obstacles, clouds, score, hiScore, speed, frame, gameOver, started, combo;
  let bgX = 0, scroll = 0;
  let runnerKeyDown = null;

  // ── パーティクル
  let particles = [];
  function spawnDust(x, y) {
    for (let i = 0; i < 5; i++) particles.push({
      x, y, vx: (Math.random() - 0.5) * 2, vy: -(Math.random() * 2),
      life: 1, r: 3 + Math.random() * 3,
    });
  }

  function init() {
    player = { x: 70, y: GROUND, vy: 0, onGround: true, w: 28, h: 36, jumps: 0, maxJumps: 2, anim: 0 };
    obstacles = [];
    clouds = [
      { x: 120, y: 40, w: 60 }, { x: 300, y: 25, w: 80 },
      { x: 440, y: 55, w: 50 }, { x: 200, y: 70, w: 40 },
    ];
    particles = [];
    score = 0; hiScore = saveData.highscores['runner'] || 0;
    speed = RUN_SPD_INIT; frame = 0; gameOver = false; started = false; combo = 0; scroll = 0;
  }

  function jump() {
    if (gameOver) { init(); started = true; return; }
    if (!started) { started = true; return; }
    if (player.jumps < player.maxJumps) {
      player.vy = player.jumps === 0 ? JUMP_V : JUMP_V * 0.85;
      player.onGround = false;
      player.jumps++;
      spawnDust(player.x + player.w / 2, player.y + player.h);
    }
  }

  function spawnObstacle() {
    const types = ['cactus', 'bird', 'spike'];
    const t = types[Math.floor(Math.random() * (score > 300 ? 3 : 2))];
    if (t === 'cactus') {
      const h = 28 + Math.floor(Math.random() * 22);
      obstacles.push({ t, x: W + 10, y: GROUND + player.h - h, w: 18, h, color: '#6bcb77' });
    } else if (t === 'bird') {
      const fly = GROUND - 55 - Math.floor(Math.random() * 40);
      obstacles.push({ t, x: W + 10, y: fly, w: 32, h: 20, color: '#ffd93d', wing: 0 });
    } else {
      obstacles.push({ t: 'spike', x: W + 10, y: GROUND + player.h - 20, w: 24, h: 20, color: '#ff6b6b' });
    }
  }

  function tick() {
    if(!started){draw();runnerRAF=requestAnimationFrame(tick);return;}
    if(gameOver){draw();return;}
    frame++;
    score++;
    scroll += speed;
    speed = RUN_SPD_INIT + Math.floor(score / 200) * 0.4;

    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y >= GROUND) {
      player.y = GROUND; player.vy = 0;
      if (!player.onGround) spawnDust(player.x + player.w / 2, GROUND + player.h);
      player.onGround = true; player.jumps = 0;
    } else { player.onGround = false; }
    player.anim = (player.anim + 0.3) % (2 * Math.PI);

    // clouds
    clouds.forEach(c => { c.x -= speed * 0.2; if (c.x + c.w < 0) c.x = W + 20; });

    // obstacles
    const gap = Math.max(55, 110 - Math.floor(score / 100) * 4);
    if (obstacles.length === 0 || W - obstacles[obstacles.length - 1].x > gap + Math.random() * 80)
      if (frame % 3 === 0 && score > 20) spawnObstacle();

    obstacles.forEach(o => {
      o.x -= speed;
      if (o.t === 'bird') o.wing = (o.wing + 0.2) % (2 * Math.PI);
    });
    obstacles = obstacles.filter(o => o.x + o.w > -10);

    // particles
    particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life -= 0.08; });
    particles = particles.filter(p => p.life > 0);

    // collision
    for (const o of obstacles) {
      const margin = 5;
      if (player.x + margin < o.x + o.w - margin &&
          player.x + player.w - margin > o.x + margin &&
          player.y + margin < o.y + o.h - margin &&
          player.y + player.h - margin > o.y + margin) {
        gameOver = true;
        if(score>hiScore)hiScore=score;
        if(score>0)recordWin('runner',score);else recordLoss(0,'runner');
        break;
      }
    }

    // score milestone toast
    if (score % 500 === 0 && score > 0) showToast(`🏃 ${score}m 通過！`, '#6bcb77');

    draw();
    runnerRAF = requestAnimationFrame(tick);
  }

  function drawPlayer(ctx) {
    const x = player.x, y = player.y, w = player.w, h = player.h, cx = x + w / 2, feet = y + h;
    const run = player.onGround ? player.anim * 2 : 0, bob = player.onGround ? Math.abs(Math.sin(run)) * -2 : 0;
    // shadow shrinks while airborne
    const lift = Math.min(1, (GROUND - y) / 90);
    ctx.fillStyle = `rgba(40,20,10,${0.28 - lift * 0.15})`;
    ctx.beginPath(); ctx.ellipse(cx, GROUND + h + 3, 15 - lift * 6, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(cx, feet + bob);
    if (player.jumps === 2 && !player.onGround) { ctx.translate(0, -h / 2); ctx.rotate(Math.min(Math.PI * 2, (player.vy + 12) * 0.35)); ctx.translate(0, h / 2); }
    const limb = (x1, y1, x2, y2, c, wd) => { ctx.strokeStyle = c; ctx.lineWidth = wd; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
    const s = Math.sin(run), c2 = Math.cos(run);
    // back leg and arm
    if (player.onGround) { limb(-2, -14, -2 - s * 8, -6 + Math.abs(s) * -2, '#2b3a67', 6); limb(-2 - s * 8, -6, -5 - s * 10, 0, '#2b3a67', 5); }
    else limb(-2, -14, -9, -6, '#2b3a67', 6);
    limb(-1, -27, -1 - s * 9, -18 - c2 * 2, '#f2b48a', 4.5);
    // scarf
    ctx.fillStyle = '#ff5a5a'; ctx.beginPath(); ctx.moveTo(-4, -29); ctx.quadraticCurveTo(-16, -30 + Math.sin(frame * 0.3) * 3, -22, -26 + Math.sin(frame * 0.3 + 1) * 4); ctx.lineTo(-18, -24); ctx.quadraticCurveTo(-12, -26, -4, -25); ctx.fill();
    // body
    ctx.fillStyle = '#ffb547'; ctx.beginPath(); ctx.roundRect(-8, -31, 16, 18, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-5, -28, 3, 12);
    // front leg
    if (player.onGround) { limb(2, -14, 2 + s * 8, -6, '#34497f', 6); limb(2 + s * 8, -6, 6 + s * 10, 0, '#34497f', 5); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(7 + s * 10, 0, 5, 3, 0, 0, Math.PI * 2); ctx.fill(); }
    else { limb(2, -14, 8, -9, '#34497f', 6); limb(8, -9, 4, -2, '#34497f', 5); }
    // head with cap
    ctx.fillStyle = '#f2b48a'; ctx.beginPath(); ctx.arc(1, -39, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3d8bff'; ctx.beginPath(); ctx.arc(1, -41, 9, Math.PI, 0); ctx.fill(); ctx.fillRect(1, -42, 13, 3);
    ctx.fillStyle = '#1d1d28'; ctx.beginPath(); ctx.ellipse(5, -38, 1.6, 2.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#a0533b'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(5, -34, 2.2, 0.2, Math.PI - 0.2); ctx.stroke();
    // front arm
    limb(3, -27, 3 + s * 10, -19 + c2 * 2, '#f2b48a', 4.5);
    ctx.restore();
    if (player.jumps === 2 && !player.onGround) {
      ctx.strokeStyle = 'rgba(255,230,120,.75)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(cx, y + h / 2, 24, 10, 0, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 4; i++) { const a = frame * 0.3 + i * 1.57; ctx.fillStyle = '#fff3b0'; ctx.fillRect(cx + Math.cos(a) * 24 - 1.5, y + h / 2 + Math.sin(a) * 10 - 1.5, 3, 3); }
    }
  }

  function hills(color, base, amp, period, offset) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) { const t = (x + offset) / period; ctx.lineTo(x, base - (Math.sin(t) * 0.6 + Math.sin(t * 2.3 + 1) * 0.4) * amp); }
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  }
  function pill(text, x, y, align, color) {
    ctx.font = '900 14px sans-serif'; const tw = ctx.measureText(text).width, px = align === 'right' ? x - tw - 18 : x;
    ctx.fillStyle = 'rgba(20,14,40,.55)'; ctx.beginPath(); ctx.roundRect(px, y - 15, tw + 18, 24, 12); ctx.fill();
    ctx.fillStyle = color; ctx.textAlign = 'left'; ctx.fillText(text, px + 9, y + 2);
  }
  function panel(lines) {
    ctx.fillStyle = 'rgba(20,12,40,.35)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(25,18,48,.88)'; ctx.beginPath(); ctx.roundRect(W / 2 - 170, H / 2 - 62, 340, 124, 22); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.textAlign = 'center';
    lines.forEach(([text, font, color, dy]) => { ctx.font = font; ctx.fillStyle = color; ctx.fillText(text, W / 2, H / 2 + dy); });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const groundY = GROUND + player.h;
    // sunset sky
    const sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, '#2c2563'); sky.addColorStop(0.55, '#8e4fa8'); sky.addColorStop(1, '#ffad7a');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    const sun = ctx.createRadialGradient(360, groundY - 70, 6, 360, groundY - 70, 70);
    sun.addColorStop(0, 'rgba(255,240,180,1)'); sun.addColorStop(0.35, 'rgba(255,200,120,.9)'); sun.addColorStop(1, 'rgba(255,170,110,0)');
    ctx.fillStyle = sun; ctx.beginPath(); ctx.arc(360, groundY - 70, 70, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    [[30,20],[90,12],[150,34],[250,16],[300,40],[420,26],[200,8]].forEach(([sx,sy],i) => { if (Math.sin(frame * 0.05 + i) > -0.3) { ctx.beginPath(); ctx.arc(sx, sy, 1.2, 0, Math.PI * 2); ctx.fill(); } });
    clouds.forEach(c => {
      ctx.fillStyle = 'rgba(255,225,235,.55)';
      ctx.beginPath(); ctx.ellipse(c.x + c.w / 2, c.y, c.w / 2, 11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(c.x + c.w * 0.35, c.y - 6, c.w * 0.22, 9, 0, 0, Math.PI * 2); ctx.fill();
    });
    // parallax hills
    hills('#5b3a8c', groundY - 52, 34, 90, scroll * 0.15);
    hills('#3d2a6e', groundY - 20, 22, 60, scroll * 0.35);
    // trees on the near hill
    for (let i = 0; i < 8; i++) {
      const tx = ((i * 73 - scroll * 0.35) % (W + 60) + W + 60) % (W + 60) - 30, ty = groundY - 16 - (i % 3) * 4;
      ctx.fillStyle = '#2a1f52'; ctx.fillRect(tx - 1.5, ty - 4, 3, 10);
      ctx.beginPath(); ctx.moveTo(tx - 9, ty); ctx.lineTo(tx, ty - 22 - (i % 2) * 6); ctx.lineTo(tx + 9, ty); ctx.fill();
    }
    // ground: grass strip and dirt with scrolling stripes
    ctx.fillStyle = '#7a4a35'; ctx.fillRect(0, groundY, W, H - groundY);
    ctx.fillStyle = '#5fc46a'; ctx.fillRect(0, groundY, W, 8);
    ctx.fillStyle = '#4aa957'; for (let gx = -(scroll % 16); gx < W; gx += 16) { ctx.beginPath(); ctx.moveTo(gx, groundY + 8); ctx.lineTo(gx + 8, groundY + 8); ctx.lineTo(gx + 4, groundY + 13); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,.12)'; for (let gx = -(scroll % 46); gx < W; gx += 46) ctx.fillRect(gx, groundY + 22, 22, 4);
    ctx.fillStyle = 'rgba(255,255,255,.08)'; for (let gx = -(scroll % 70) + 20; gx < W; gx += 70) ctx.fillRect(gx, groundY + 34, 14, 3);

    obstacles.forEach(o => {
      if (o.t === 'cactus') {
        const g = ctx.createLinearGradient(o.x, 0, o.x + o.w, 0); g.addColorStop(0, '#3fae5a'); g.addColorStop(1, '#2b8a45');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.roundRect(o.x + 4, o.y, 10, o.h + 2, 5); ctx.fill();
        ctx.beginPath(); ctx.roundRect(o.x - 1, o.y + 8, 6, 12, 3); ctx.fill(); ctx.fillRect(o.x - 1, o.y + 16, 7, 4);
        ctx.beginPath(); ctx.roundRect(o.x + 13, o.y + 12, 6, 10, 3); ctx.fill(); ctx.fillRect(o.x + 12, o.y + 18, 7, 4);
        ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(o.x + 6, o.y + 3, 2, o.h - 6);
        ctx.fillStyle = '#ff7aa8'; ctx.beginPath(); ctx.arc(o.x + 9, o.y + 1, 3, 0, Math.PI * 2); ctx.fill();
      } else if (o.t === 'bird') {
        const cx = o.x + o.w / 2, cy = o.y + o.h / 2, wy = Math.sin(o.wing) * 9;
        ctx.fillStyle = '#ff8a3d'; ctx.beginPath(); ctx.moveTo(o.x - 2, cy); ctx.lineTo(o.x - 9, cy - 2); ctx.lineTo(o.x - 2, cy + 3); ctx.fill();
        ctx.fillStyle = '#ffd24d'; ctx.beginPath(); ctx.ellipse(cx, cy, o.w / 2, o.h / 2 - 1, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f2a922'; ctx.beginPath(); ctx.moveTo(cx - 2, cy - 2); ctx.quadraticCurveTo(cx + 4, cy - 14 - wy, cx + 12, cy - 4 - wy * 0.5); ctx.quadraticCurveTo(cx + 6, cy + 2, cx - 2, cy - 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(o.x + 7, cy - 3, 3.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1d1d28'; ctx.beginPath(); ctx.arc(o.x + 6, cy - 3, 1.6, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = '#6f6680'; ctx.beginPath(); ctx.roundRect(o.x - 2, o.y + o.h - 8, o.w + 4, 10, 4); ctx.fill();
        const g = ctx.createLinearGradient(0, o.y, 0, o.y + o.h); g.addColorStop(0, '#e9e6ff'); g.addColorStop(1, '#8f87b5');
        ctx.fillStyle = g;
        for (let i = 0; i < 3; i++) { const sx = o.x + i * 8; ctx.beginPath(); ctx.moveTo(sx, o.y + o.h - 6); ctx.lineTo(sx + 4, o.y + (i === 1 ? 0 : 6)); ctx.lineTo(sx + 8, o.y + o.h - 6); ctx.closePath(); ctx.fill(); }
      }
    });

    particles.forEach(p => {
      ctx.globalAlpha = p.life * 0.7; ctx.fillStyle = '#d9b48a';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    drawPlayer(ctx);

    // HUD
    pill(`🏃 ${score}m`, 10, 24, 'left', '#fff');
    pill(`🏆 ${hiScore}m`, W - 10, 24, 'right', '#ffe28a');
    const spd = Math.round((speed - RUN_SPD_INIT) / 0.4 + 1);
    pill(`⚡ SPEED ${spd}`, 10, 54, 'left', spd > 1 ? '#ffb4a8' : '#b8f5c4');

    if (!started && !gameOver) panel([['タップ / スペースでスタート', '900 22px sans-serif', '#ffe28a', -8], ['ジャンプ：タップ・スペース・↑（空中でもう1回）', '13px sans-serif', 'rgba(255,255,255,.75)', 22]]);
    if (gameOver) panel([
      ...(score >= hiScore && score > 0 ? [['🏆 新記録！', '900 15px sans-serif', '#7ee08a', -34]] : []),
      ['GAME OVER', '900 26px sans-serif', '#ff8f8f', -8], [`${score}m 走った！`, '900 17px sans-serif', '#ffe28a', 18], ['タップ / スペースでリトライ', '13px sans-serif', 'rgba(255,255,255,.75)', 42]]);
  }

  el.innerHTML = `
    <div class="game-header"><h2>🏃 ランナー</h2><p>障害物を避けて走り続けろ！2段ジャンプあり</p></div>
    <canvas id="runner-canvas" width="${W}" height="${H}"
      style="display:block;margin:0 auto;border-radius:18px;cursor:pointer;width:100%;max-width:560px;height:auto;touch-action:manipulation"></canvas>
    <div style="display:flex;gap:8px;justify-content:center;margin-top:12px;flex-wrap:wrap">
      <button class="btn btn-success runner-jump" id="run-jump-btn" ontouchstart="event.preventDefault();runJump()" onclick="runJump()">⬆ ジャンプ</button>
      <button class="btn btn-sm" onclick="startGame('runner')">リセット</button>
    </div>
    <p style="text-align:center;color:var(--text2);font-size:11px;margin-top:8px">🌵 サボテン / 🐦 鳥 / △ スパイクを避けよう</p>`;

  canvas = document.getElementById('runner-canvas');
  ctx = canvas.getContext('2d');

  init();

  canvas.addEventListener('click', jump);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); jump(); }, { passive: false });
  window.runJump = jump;

  // keyboard
  document.removeEventListener('keydown', runnerKeyDown);
  runnerKeyDown = e => {
    if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); jump(); }
  };
  document.addEventListener('keydown', runnerKeyDown);

  cancelAnimationFrame(runnerRAF);
  runnerRAF = requestAnimationFrame(tick);
  el._cleanup=()=>{cancelAnimationFrame(runnerRAF);if(runnerKeyDown)document.removeEventListener('keydown',runnerKeyDown);};
};
