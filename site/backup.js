// サイト版 ALLGAME の「セーブの書き出し・読み込み」。
// トップページの右上にボタンを出す。アプリ版にはこのファイルを読み込まないので出ない。
//
// - 書き出し: このブラウザにある ALLGAME の全ゲームのセーブを 1 つの JSON ファイルにして保存する
// - 読み込み: そのファイルを選ぶと、中のセーブをこのブラウザに書き戻す（同じゲームのセーブは上書き）
//
// github.io の同じアドレスには他のサイトのデータも入っているので、
// app/games.js の saveKeys（と ALLGAME 自身の記録 allgame-）に当てはまる名前だけを扱う。
(() => {
  const FORMAT = 'allgame-save';
  const OWN_KEYS = ['allgame-'];

  const isOurs = (key, prefixes) => prefixes.some((p) => key === p || key.startsWith(p));
  const stamp = () => {
    const d = new Date();
    const z = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}-${z(d.getHours())}${z(d.getMinutes())}`;
  };

  function collect(prefixes) {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && isOurs(key, prefixes)) data[key] = localStorage.getItem(key);
    }
    return data;
  }

  function exportSaves(prefixes) {
    let data;
    try { data = collect(prefixes); } catch { alert('このブラウザではセーブを読み出せませんでした。'); return; }
    const count = Object.keys(data).length;
    if (!count) { alert('書き出せるセーブがまだありません。ゲームを遊ぶと保存されます。'); return; }
    const body = JSON.stringify({ format: FORMAT, version: 1, exportedAt: new Date().toISOString(), data }, null, 1);
    const url = URL.createObjectURL(new Blob([body], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `allgame-save-${stamp()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function importSaves(file, prefixes) {
    let parsed;
    try { parsed = JSON.parse(await file.text()); } catch { alert('ファイルを読み取れませんでした。ALLGAME で書き出したファイルを選んでください。'); return; }
    if (!parsed || parsed.format !== FORMAT || typeof parsed.data !== 'object' || !parsed.data) {
      alert('ALLGAME のセーブファイルではないようです。');
      return;
    }
    // ALLGAME のセーブで、中身が文字列のものだけを使う
    const entries = Object.entries(parsed.data).filter(([k, v]) => isOurs(k, prefixes) && typeof v === 'string');
    if (!entries.length) { alert('このファイルには読み込めるセーブが入っていませんでした。'); return; }
    const when = parsed.exportedAt ? new Date(parsed.exportedAt).toLocaleString('ja-JP') : '不明';
    const ok = confirm(
      `${when} に書き出したセーブ（${entries.length}件）を読み込みます。\n\n` +
      'このブラウザにある同じゲームのセーブは上書きされ、元に戻せません。\n' +
      '心配なときは、先に「セーブを書き出す」で今のセーブを保存してください。\n\nよろしいですか？'
    );
    if (!ok) return;
    try {
      for (const [k, v] of entries) localStorage.setItem(k, v);
    } catch {
      alert('セーブを書き込めませんでした（ブラウザの保存容量がいっぱいの可能性があります）。');
      return;
    }
    alert(`${entries.length}件のセーブを読み込みました。`);
    location.reload();
  }

  const CSS = `
    .backup { display: flex; gap: 8px; margin-left: auto; align-self: center; }
    .backup button {
      font: inherit; font-size: 13px; color: var(--text); cursor: pointer;
      background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 8px 12px;
      transition: background .15s ease, border-color .15s ease;
    }
    .backup button:hover, .backup button:focus-visible { background: var(--panel-hover); border-color: var(--muted); outline: none; }
  `;

  async function setup() {
    let games = [];
    try { games = (await (await fetch('__games.json')).json()).games || []; } catch { return; }
    const prefixes = OWN_KEYS.concat(...games.map((g) => g.saveKeys || []));

    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    const box = document.createElement('div');
    box.className = 'backup';
    const exportBtn = document.createElement('button');
    exportBtn.type = 'button';
    exportBtn.textContent = '💾 セーブを書き出す';
    exportBtn.title = '全ゲームのセーブを1つのファイルに保存します';
    const importBtn = document.createElement('button');
    importBtn.type = 'button';
    importBtn.textContent = '📂 セーブを読み込む';
    importBtn.title = '書き出したファイルからセーブを戻します';
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.hidden = true;

    exportBtn.addEventListener('click', () => exportSaves(prefixes));
    importBtn.addEventListener('click', () => input.click());
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      input.value = '';
      if (file) importSaves(file, prefixes);
    });

    box.append(exportBtn, importBtn, input);
    document.querySelector('header').appendChild(box);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
  else setup();
})();
