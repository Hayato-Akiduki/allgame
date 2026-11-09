// サイト版 ALLGAME の共通スクリプト。サイトを組み立てるとき、各ゲームの HTML に自動で読み込まれる。
// （元のゲームファイルには入らない。アプリ版にも入らない）
//
// 今できること:
// - 画面上部の中央に「ALLGAME に戻る」タブを出す
//   ・開いてから数秒は見えていて、その後は細い帯だけ残して上に隠れる
//   ・マウスを画面上端の中央に近づけると下りてくる
//   ・ゲームの見た目とぶつからないよう Shadow DOM の中に作る
// - プレイ回数・プレイ時間・最後に遊んだ日時を記録する（トップページのダッシュボードで表示）
(() => {
  if (window.top !== window) return; // 枠（iframe）の中で開かれたときは出さない
  const HOME = '../';
  const SHOW_FIRST_MS = 2500;

  const host = document.createElement('div');
  host.id = 'allgame-hub';
  host.style.cssText = 'all: initial; position: fixed; top: 0; left: 50%; z-index: 2147483647; transform: translateX(-50%);';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
    <style>
      :host { all: initial; }
      .zone {
        /* マウスを近づけたことを拾うための透明な領域 */
        padding: 0 24px 14px;
      }
      a {
        display: flex; align-items: center; gap: 8px;
        padding: 7px 16px 8px;
        background: rgba(15, 17, 21, .88);
        color: #eef0f4;
        border: 1px solid rgba(255, 255, 255, .14);
        border-top: none;
        border-radius: 0 0 12px 12px;
        font: 600 13px/1 "Yu Gothic UI", "Meiryo", system-ui, sans-serif;
        letter-spacing: .04em;
        text-decoration: none;
        white-space: nowrap;
        box-shadow: 0 6px 18px rgba(0, 0, 0, .35);
        transition: transform .22s ease, opacity .22s ease;
        cursor: pointer;
      }
      a:hover { background: rgba(32, 36, 45, .95); }
      a:focus-visible { outline: 2px solid #4f8cff; outline-offset: 2px; }
      img { width: 16px; height: 16px; }
      .arrow { opacity: .7; }
      /* 隠れているときは下の 5px だけ見える。
         反応する範囲も上端 8px だけにして、下にあるゲームのボタンを押せなくしないようにする */
      .zone.hidden { height: 8px; padding-bottom: 0; }
      .hidden a { transform: translateY(calc(-100% + 5px)); opacity: .55; }
      .hidden a:focus-visible { transform: none; opacity: 1; }
    </style>
    <div class="zone">
      <a href="${HOME}" title="ゲーム一覧に戻る">
        <span class="arrow">◀</span><img src="${HOME}icon.png" alt="">ALLGAME
      </a>
    </div>`;

  const zone = root.querySelector('.zone');
  let timer = null;
  const show = () => { clearTimeout(timer); zone.classList.remove('hidden'); };
  const hideLater = (ms) => { clearTimeout(timer); timer = setTimeout(() => zone.classList.add('hidden'), ms); };

  zone.addEventListener('mouseenter', show);
  zone.addEventListener('mouseleave', () => hideLater(400));

  const mount = () => {
    document.body.appendChild(host);
    hideLater(SHOW_FIRST_MS);
    // ゲームが画面を作り直して消してしまった場合に付け直す
    setInterval(() => { if (!host.isConnected && document.body) document.body.appendChild(host); }, 2000);
  };
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();

// ---- プレイ記録 ----
// localStorage の 'allgame-stats' に { games: { <id>: { plays, ms, last } } } の形で保存する。
// 放置ゲームを開きっぱなしにしても増えすぎないよう、直近 1 分以内にキーボードかマウスの操作が
// あった時間だけをプレイ時間として数える。
(() => {
  if (window.top !== window) return;
  const KEY = 'allgame-stats';
  const IDLE_MS = 60 * 1000;
  const TICK_MS = 5 * 1000;

  // URL の最後のフォルダ名がゲームの id（例: /allgame/wordle/ → wordle）
  const parts = location.pathname.split('/').filter(Boolean);
  if (parts.length && /\.html?$/i.test(parts[parts.length - 1])) parts.pop();
  const id = parts[parts.length - 1];
  if (!id) return;

  const read = () => {
    try {
      const d = JSON.parse(localStorage.getItem(KEY) || '{}');
      return d && typeof d === 'object' && d.games ? d : { games: {} };
    } catch { return { games: {} }; }
  };
  // 遊んだ日（YYYY-MM-DD）の一覧。スタンプ「〇日遊ぶ」に使う
  const today = () => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  };
  const update = (fn) => {
    try {
      const d = read();
      const g = d.games[id] || (d.games[id] = { plays: 0, ms: 0, last: 0 });
      fn(g);
      const day = today();
      d.days = Array.isArray(d.days) ? d.days : [];
      if (!d.days.includes(day)) d.days = d.days.concat(day).slice(-400);
      localStorage.setItem(KEY, JSON.stringify(d));
    } catch { /* 保存できない環境では記録しない */ }
  };

  // 開いた回数（1 分以内の再読み込みは数えない）
  update((g) => {
    const now = Date.now();
    if (now - (g.last || 0) > 60 * 1000) g.plays += 1;
    g.last = now;
  });

  let lastInput = Date.now();
  let lastTick = Date.now();
  const onInput = () => { lastInput = Date.now(); };
  for (const type of ['keydown', 'pointerdown', 'pointermove', 'wheel', 'touchstart']) {
    window.addEventListener(type, onInput, { capture: true, passive: true });
  }

  const flush = () => {
    const now = Date.now();
    const elapsed = now - lastTick;
    lastTick = now;
    const active = document.visibilityState === 'visible' && now - lastInput < IDLE_MS;
    if (active && elapsed > 0 && elapsed < TICK_MS * 3) {
      update((g) => { g.ms += elapsed; g.last = now; });
    }
  };
  setInterval(flush, TICK_MS);
  document.addEventListener('visibilitychange', flush);
  window.addEventListener('pagehide', flush);
})();
