// サイト版 ALLGAME のトップページに出すプレイ記録（ダッシュボード）。
// トップページ（app/menu/index.html）がカードを並べたあとに window.ALLGAME_DASHBOARD(games) を呼ぶ。
// アプリ版ではこのファイルを読み込まないので、何も起きない。
//
// 使うデータ（どれもこのブラウザの localStorage にあるもの。読むだけで書き換えない）
// - allgame-stats … hub.js が記録するプレイ回数・時間・最後に遊んだ日時
// - 各ゲームのセーブデータ … 進み具合を 1 行で表示する（PROGRESS を参照）
(() => {
  const readJSON = (key) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; }
  };
  const num = (n) => Number(n || 0).toLocaleString('ja-JP');
  // ¥ の大きい金額は「1.2億」「350万」のように縮める
  const yen = (n) => {
    n = Number(n) || 0;
    if (Math.abs(n) >= 1e8) return `¥${(n / 1e8).toFixed(1).replace(/\.0$/, '')}億`;
    if (Math.abs(n) >= 1e4) return `¥${Math.round(n / 1e4).toLocaleString('ja-JP')}万`;
    return `¥${num(n)}`;
  };

  // ゲームごとの「進み具合」。セーブがない・形が違うときは null を返して何も出さない
  const PROGRESS = {
    'money-wars': () => {
      const b = readJSON('coinwars-best');
      if (!b || !b.best) return null;
      return `最高 ラウンド${num(b.best.round)}${b.clears ? `・クリア${num(b.clears)}回` : ''}`;
    },
    spikeline: () => {
      const c = readJSON('spikeline-career-v1');
      if (!c || !c.matches) return null;
      return `Lv.${num(c.level)}・${num(c.wins)}勝 / ${num(c.matches)}試合`;
    },
    wordle: () => {
      const parts = [];
      for (const [prefix, label] of [['wu', '英語'], ['wj', 'ひらがな']]) {
        const s = readJSON(`${prefix}-stats`);
        if (s && s.played) parts.push(`${label} ${num(s.wins)}勝・最長${num(s.best)}連勝`);
      }
      return parts.join(' / ') || null;
    },
    nawabari: () => {
      const s = readJSON('nawabari-ink-save-v1');
      if (!s) return null;
      return `コイン ${num(s.coins)}・ブキ ${Array.isArray(s.owned) ? s.owned.length : 1}種`;
    },
    'cyber-arena': () => {
      let best = 0;
      try { best = parseInt(localStorage.getItem('cyber_arena_best_score') || '0', 10) || 0; } catch {}
      return best ? `ベスト ${num(best)}点` : null;
    },
    shacho: () => {
      const s = readJSON('shacho-ledger-v1');
      if (!s || s.month == null) return null;
      return `${s.name ? `${s.name}・` : ''}${num(s.month)}か月目・資金 ${yen(s.cash)}`;
    },
    lastline: () => {
      const s = readJSON('lastline-save-v2');
      if (!s) return null;
      const stars = Object.values(s.cleared || {}).filter((v) => typeof v === 'number');
      const parts = [];
      if (stars.length) parts.push(`${stars.length}ステージ クリア・★${stars.reduce((a, b) => a + b, 0)}`);
      if (s.bestWave) parts.push(`最高 Wave ${num(s.bestWave)}`);
      return parts.join('・') || null;
    },
    kabu: () => {
      const s = readJSON('kabu_save_v1');
      const p = s && s.portfolio;
      if (!p) return null;
      const trophies = Array.isArray(p.unlockedTrophies) ? p.unlockedTrophies.length : 0;
      return `最高資産 ${yen(p.peakAsset)}${trophies ? `・トロフィー ${trophies}個` : ''}`;
    },
    kokeniwa: () => {
      const s = readJSON('kokeniwa-v1');
      if (!s || s.spores == null) return null;
      return `胞子 ${num(Math.floor(s.spores))}${s.total ? `（累計 ${num(Math.floor(s.total))}）` : ''}`;
    },
    tetsu: () => {
      const s = readJSON('tetsu-no-tairiku-v1');
      if (!s || s.day == null) return null;
      return `${num(s.day)}日目まで進行中`;
    },
  };

  const duration = (ms) => {
    const min = Math.floor((ms || 0) / 60000);
    if (min < 1) return '1分未満';
    if (min < 60) return `${min}分`;
    const h = Math.floor(min / 60);
    return min % 60 ? `${h}時間${min % 60}分` : `${h}時間`;
  };
  const ago = (t) => {
    const s = Math.floor((Date.now() - t) / 1000);
    if (s < 60) return 'たった今';
    if (s < 3600) return `${Math.floor(s / 60)}分前`;
    if (s < 86400) return `${Math.floor(s / 3600)}時間前`;
    if (s < 86400 * 30) return `${Math.floor(s / 86400)}日前`;
    return new Date(t).toLocaleDateString('ja-JP');
  };
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };

  const CSS = `
    .dash { padding: 0 48px 8px; }
    .dash-summary { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 18px; }
    .stat { background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 12px 16px; min-width: 150px; }
    .stat-label { color: var(--muted); font-size: 12px; }
    .stat-value { font-size: 20px; font-weight: 700; margin-top: 4px; font-variant-numeric: tabular-nums; }
    .dash h2 { font-size: 14px; font-weight: 700; color: var(--muted); letter-spacing: .06em; margin: 0 0 10px; }
    .recent { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); margin-bottom: 28px; }
    .recent a {
      display: block; padding: 14px 16px 14px 18px; border-radius: 10px; text-decoration: none; color: inherit;
      background: var(--panel); border: 1px solid var(--line); border-left: 4px solid var(--c);
      transition: background .15s ease, transform .15s ease;
    }
    .recent a:hover, .recent a:focus-visible { background: var(--panel-hover); transform: translateY(-2px); outline: none; }
    .recent .r-title { font-weight: 700; font-size: 16px; }
    .recent .r-meta { color: var(--muted); font-size: 12px; margin-top: 4px; }
    .recent .r-prog { font-size: 13px; margin-top: 8px; }
    .all-title { padding: 0 48px; }
    a.card .prog { margin-top: 8px; font-size: 12px; color: var(--text); opacity: .85; }
    a.card .play {
      position: absolute; top: 16px; right: 18px; z-index: 1; font-size: 12px; color: var(--muted);
      font-variant-numeric: tabular-nums;
    }
    a.card .play.new { color: var(--c); font-weight: 700; }
  `;

  window.ALLGAME_DASHBOARD = (games) => {
    const stats = (readJSON('allgame-stats') || {}).games || {};
    const local = games.filter((g) => !g.external);
    const progress = {};
    for (const g of local) {
      try { progress[g.id] = PROGRESS[g.id] ? PROGRESS[g.id]() : null; } catch { progress[g.id] = null; }
    }

    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    // カードに「回数・時間」または「未プレイ」と、進み具合を足す
    document.querySelectorAll('a.card').forEach((card) => {
      const g = games.find((x) => x.url === card.getAttribute('href'));
      if (!g || g.external) return;
      const st = stats[g.id];
      const played = (st && st.plays) || progress[g.id];
      const badge = el('span', played ? 'play' : 'play new', played && st ? `${num(st.plays)}回・${duration(st.ms)}` : played ? '' : '未プレイ');
      if (badge.textContent) card.appendChild(badge);
      if (progress[g.id]) card.appendChild(el('span', 'prog', progress[g.id]));
    });

    // 上部のまとめと「続きから遊ぶ」
    const totalMs = local.reduce((sum, g) => sum + ((stats[g.id] && stats[g.id].ms) || 0), 0);
    const playedCount = local.filter((g) => (stats[g.id] && stats[g.id].plays) || progress[g.id]).length;
    const recent = local
      .filter((g) => stats[g.id] && stats[g.id].last)
      .sort((a, b) => stats[b.id].last - stats[a.id].last)
      .slice(0, 3);

    const dash = el('section', 'dash');
    const summary = el('div', 'dash-summary');
    const addStat = (label, value) => {
      const s = el('div', 'stat');
      s.append(el('div', 'stat-label', label), el('div', 'stat-value', value));
      summary.appendChild(s);
    };
    addStat('合計プレイ時間', totalMs ? duration(totalMs) : '—');
    addStat('遊んだゲーム', `${playedCount} / ${local.length}`);
    const unplayed = local.length - playedCount;
    addStat('まだ遊んでいない', unplayed ? `${unplayed}本` : 'なし 🎉');
    dash.appendChild(summary);

    if (recent.length) {
      dash.appendChild(el('h2', null, '続きから遊ぶ'));
      const row = el('div', 'recent');
      for (const g of recent) {
        const a = el('a');
        a.href = g.url;
        a.style.setProperty('--c', g.color);
        a.appendChild(el('div', 'r-title', g.title));
        a.appendChild(el('div', 'r-meta', `${ago(stats[g.id].last)}・${num(stats[g.id].plays)}回・${duration(stats[g.id].ms)}`));
        if (progress[g.id]) a.appendChild(el('div', 'r-prog', progress[g.id]));
        row.appendChild(a);
      }
      dash.appendChild(row);
    }

    const main = document.getElementById('list');
    main.before(dash);
    const allTitle = el('div', 'dash all-title');
    allTitle.appendChild(el('h2', null, 'すべてのゲーム'));
    main.before(allTitle);
  };
})();
