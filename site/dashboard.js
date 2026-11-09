// サイト版 ALLGAME のプレイ記録・進み具合・スタンプを計算して、トップページに渡す。
// トップページ（app/menu/index.html）が window.ALLGAME_DATA.load(games) を呼んで表示に使う。
// 表示は全部トップページ側でする。アプリ版ではこのファイルを読み込まないので、記録の表示は出ない。
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

  // スタンプを判定し、初めて取ったものは時刻を記録する（isNew が付く）
  function evaluateStamps(games, played, totalMs, days) {
    const ctx = { played, total: games.length, ms: totalMs, days };
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
      s.isNew = false;
      if (ok && !got[s.id]) { got[s.id] = Date.now(); s.isNew = true; changed = true; }
      s.at = got[s.id] || null;
      delete s.check;
    }
    if (changed) { try { localStorage.setItem(STAMP_KEY, JSON.stringify({ got })); } catch {} }
    return list;
  }

  window.ALLGAME_DATA = {
    duration,
    ago,
    num,
    // games: トップページが読んだゲーム一覧。外部サイト（ミニゲームランド）は記録の対象外
    load(games) {
      const raw = readJSON('allgame-stats') || {};
      const stats = raw.games || {};
      const local = games.filter((g) => !g.external);
      const perGame = {};
      for (const g of local) {
        let progress = null;
        try { progress = PROGRESS[g.id] ? PROGRESS[g.id]() : null; } catch { progress = null; }
        const st = stats[g.id] || null;
        perGame[g.id] = {
          plays: (st && st.plays) || 0,
          ms: (st && st.ms) || 0,
          last: (st && st.last) || 0,
          progress,
          played: !!((st && st.plays) || progress),
        };
      }
      const totalMs = local.reduce((sum, g) => sum + perGame[g.id].ms, 0);
      const playedCount = local.filter((g) => perGame[g.id].played).length;
      const days = Array.isArray(raw.days) ? raw.days.length : 0;
      const stamps = evaluateStamps(local, playedCount, totalMs, days);
      return { perGame, totalMs, playedCount, total: local.length, days, stamps };
    },
  };
})();
