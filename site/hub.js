// サイト版 ALLGAME の共通スクリプト。サイトを組み立てるとき、各ゲームの HTML に自動で読み込まれる。
// （元のゲームファイルには入らない。アプリ版にも入らない）
//
// 今できること:
// - 画面上部の中央に「ALLGAME に戻る」タブを出す
//   ・開いてから数秒は見えていて、その後は細い帯だけ残して上に隠れる
//   ・マウスを画面上端の中央に近づけると下りてくる
//   ・ゲームの見た目とぶつからないよう Shadow DOM の中に作る
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
