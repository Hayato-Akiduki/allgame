// サイト版 ALLGAME のトップページに出すプレイ記録（ダッシュボード）。
// トップページ（app/menu/index.html）がカードを並べたあとに window.ALLGAME_DASHBOARD(games) を呼ぶ。
// アプリ版ではこのファイルを読み込まないので、何も起きない。
//
// 使うデータ（どれもこのブラウザの localStorage にあるもの。読むだけで書き換えない）
// - allgame-stats … hub.js が記録するプレイ回数・時間・最後に遊んだ日時
// - 各ゲームのセーブデータ … 進み具合を 1 行で表示する（PROGRESS を参照）
// - スタンプカード … ゲームごとのスタンプ（GAME_STAMPS）と共通スタンプ（COMMON_STAMPS）。
//   取った時刻だけは allgame-stamps に書く（一度取ったスタンプはセーブを消しても残る）
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

  // ---- スタンプカード ----
  // ゲームスタンプ: ゲームごとに 1 つ。セーブデータを読んで達成を判定する（目標の数字はここで調整できる）
  const GAME_STAMPS = {
    'money-wars': { icon: '🪙', goal: '1回クリアする', check: () => (readJSON('coinwars-best') || {}).clears >= 1 },
    spikeline: { icon: '🏐', goal: '10勝する', check: () => (readJSON('spikeline-career-v1') || {}).wins >= 10 },
    wordle: {
      icon: '🔤', goal: 'どちらかのモードで5連勝する',
      check: () => ['wu', 'wj'].some((p) => (readJSON(`${p}-stats`) || {}).best >= 5),
    },
    nawabari: {
      icon: '🎨', goal: 'ブキを3種類そろえる',
      check: () => { const s = readJSON('nawabari-ink-save-v1'); return !!s && Array.isArray(s.owned) && s.owned.length >= 3; },
    },
    'cyber-arena': {
      icon: '🎯', goal: '10,000点を取る',
      check: () => { try { return (parseInt(localStorage.getItem('cyber_arena_best_score') || '0', 10) || 0) >= 10000; } catch { return false; } },
    },
    shacho: { icon: '📒', goal: '12か月経営を続ける', check: () => (readJSON('shacho-ledger-v1') || {}).month >= 12 },
    lastline: {
      icon: '🏰', goal: '3ステージをクリアする',
      check: () => Object.values((readJSON('lastline-save-v2') || {}).cleared || {}).filter((v) => v > 0).length >= 3,
    },
    kabu: { icon: '📈', goal: '総資産の最高を1,500万円にする', check: () => (((readJSON('kabu_save_v1') || {}).portfolio) || {}).peakAsset >= 15000000 },
    kokeniwa: { icon: '🌿', goal: '胞子を累計10,000集める', check: () => (readJSON('kokeniwa-v1') || {}).total >= 10000 },
    tetsu: { icon: '⚙️', goal: '100日目まで進める', check: () => (readJSON('tetsu-no-tairiku-v1') || {}).day >= 100 },
  };
  // 共通スタンプ: ゲームをまたいだ遊び方で取れる
  const COMMON_STAMPS = [
    { id: 'first', icon: '🎮', title: 'はじめの一歩', goal: 'どれか1本を遊ぶ', check: (c) => c.played >= 1 },
    { id: 'explorer', icon: '🧭', title: '寄り道好き', goal: '5本のゲームを遊ぶ', check: (c) => c.played >= 5 },
    { id: 'all', icon: '🌏', title: '全部制覇', goal: 'すべてのゲームを遊ぶ', check: (c) => c.played >= c.total },
    { id: 'hour1', icon: '⏱️', title: '1時間', goal: '合計1時間遊ぶ', check: (c) => c.ms >= 3600e3 },
    { id: 'hour10', icon: '⌛', title: 'やり込み', goal: '合計10時間遊ぶ', check: (c) => c.ms >= 36000e3 },
    { id: 'days3', icon: '📅', title: '常連さん', goal: '3日間遊ぶ', check: (c) => c.days >= 3 },
  ];
  const STAMP_KEY = 'allgame-stamps'; // { got: { <スタンプid>: 取った時刻 } }

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
    .stamps-head { display: flex; align-items: baseline; gap: 12px; }
    .stamps-head .count { color: var(--muted); font-size: 13px; font-variant-numeric: tabular-nums; }
    .stamps {
      display: grid; gap: 10px; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
      background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 16px; margin-bottom: 28px;
    }
    .stamp { position: relative; display: flex; gap: 10px; align-items: center; padding: 6px; border-radius: 8px; }
    .stamp .seal {
      flex: none; width: 48px; height: 48px; border-radius: 50%; display: grid; place-items: center; font-size: 22px;
      border: 2px dashed var(--line); filter: grayscale(1); opacity: .45;
    }
    .stamp.got .seal {
      border: 3px solid var(--c); filter: none; opacity: 1;
      background: radial-gradient(circle, color-mix(in srgb, var(--c) 28%, transparent), transparent 70%);
      transform: rotate(-8deg);
    }
    .stamp .s-title { font-size: 13px; font-weight: 700; line-height: 1.3; }
    .stamp .s-goal { font-size: 11px; color: var(--muted); margin-top: 2px; line-height: 1.35; }
    .stamp:not(.got) .s-title { color: var(--muted); }
    .stamp.new { background: color-mix(in srgb, var(--c) 14%, transparent); }
    .stamp.new::after {
      content: 'NEW'; position: absolute; top: 2px; left: 2px; font-size: 10px; font-weight: 800; letter-spacing: .05em;
      background: var(--c); color: #0f1115; border-radius: 4px; padding: 1px 4px;
    }
    .stamp.new .seal { animation: stamp-in .5s cubic-bezier(.2, 1.6, .4, 1) both; }
    @keyframes stamp-in { from { transform: scale(1.8) rotate(-30deg); opacity: 0; } to { transform: rotate(-8deg); opacity: 1; } }
    .complete {
      grid-column: 1 / -1; text-align: center; padding: 12px; border-radius: 8px; font-weight: 800; font-size: 16px;
      background: linear-gradient(90deg, #6b4e00, #c9a227, #6b4e00); color: #fff8dc; letter-spacing: .04em;
    }
    body.allgame-complete h1 {
      background: linear-gradient(90deg, #f5d76e, #fff3c4, #c9a227); -webkit-background-clip: text; background-clip: text; color: transparent;
    }
  `;

  // スタンプを判定し、初めて取ったものは時刻を記録する
  function evaluateStamps(games, stats, played, totalMs) {
    const ctx = {
      played, total: games.length, ms: totalMs,
      days: Array.isArray((readJSON('allgame-stats') || {}).days) ? readJSON('allgame-stats').days.length : 0,
    };
    const list = [
      ...games.filter((g) => GAME_STAMPS[g.id]).map((g) => ({
        id: `game:${g.id}`, icon: GAME_STAMPS[g.id].icon, title: g.title, goal: GAME_STAMPS[g.id].goal, color: g.color,
        check: GAME_STAMPS[g.id].check,
      })),
      ...COMMON_STAMPS.map((s) => ({ ...s, id: `common:${s.id}`, color: '#c9a227', check: () => s.check(ctx) })),
    ];
    const saved = readJSON(STAMP_KEY) || {};
    const got = saved.got && typeof saved.got === 'object' ? saved.got : {};
    let changed = false;
    for (const s of list) {
      let ok = false;
      try { ok = !!s.check(); } catch { ok = false; }
      s.got = ok || !!got[s.id]; // 一度取ったスタンプは、セーブを消しても残す
      if (ok && !got[s.id]) { got[s.id] = Date.now(); s.isNew = true; changed = true; }
      s.at = got[s.id] || null;
    }
    if (changed) { try { localStorage.setItem(STAMP_KEY, JSON.stringify({ got })); } catch {} }
    return list;
  }

  function renderStamps(list) {
    const wrap = el('div');
    const done = list.filter((s) => s.got).length;
    const head = el('div', 'stamps-head');
    head.append(el('h2', null, 'スタンプカード'), el('span', 'count', `${done} / ${list.length}`));
    wrap.appendChild(head);
    const grid = el('div', 'stamps');
    if (done === list.length) {
      grid.appendChild(el('div', 'complete', '🏆 スタンプコンプリート！ すべてのゲームを遊びこみました'));
      document.body.classList.add('allgame-complete');
    }
    // 取ったものを先に、新しく取ったものをいちばん先に並べる
    const sorted = [...list].sort((a, b) => (b.isNew ? 2 : b.got ? 1 : 0) - (a.isNew ? 2 : a.got ? 1 : 0));
    for (const s of sorted) {
      const item = el('div', `stamp${s.got ? ' got' : ''}${s.isNew ? ' new' : ''}`);
      item.style.setProperty('--c', s.color);
      item.title = s.got && s.at ? `${new Date(s.at).toLocaleDateString('ja-JP')} に獲得` : `目標: ${s.goal}`;
      const text = el('div');
      text.append(el('div', 's-title', s.title), el('div', 's-goal', s.goal));
      item.append(el('div', 'seal', s.icon), text);
      grid.appendChild(item);
    }
    wrap.appendChild(grid);
    return { node: wrap, done, total: list.length };
  }

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
    const stamps = renderStamps(evaluateStamps(local, stats, playedCount, totalMs));
    addStat('スタンプ', `${stamps.done} / ${stamps.total}`);
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
    dash.appendChild(stamps.node);

    const main = document.getElementById('list');
    main.before(dash);
    const allTitle = el('div', 'dash all-title');
    allTitle.appendChild(el('h2', null, 'すべてのゲーム'));
    main.before(allTitle);
  };
})();
