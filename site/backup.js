// サイト版 ALLGAME の「セーブの書き出し・読み込み」。
// トップページの「セーブ」パネルから呼ばれる。
//
// - 書き出し: このブラウザにある ALLGAME の全ゲームのセーブを 1 つの JSON ファイルにして保存する
// - 読み込み: そのファイルを選ぶと、中のセーブをこのブラウザに書き戻す（同じゲームのセーブは上書き）
//
// github.io の同じアドレスには他のサイトのデータも入っているので、
// site/games.js の saveKeys（と ALLGAME 自身の記録 allgame-）に当てはまる名前だけを扱う。
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

  // トップページから呼ぶための関数。ボタンなどの表示はトップページ側でする
  const prefixesReady = fetch('__games.json')
    .then((r) => r.json())
    .then((d) => OWN_KEYS.concat(...(d.games || []).map((g) => g.saveKeys || [])))
    .catch(() => OWN_KEYS);

  window.ALLGAME_BACKUP = {
    async exportSaves() { exportSaves(await prefixesReady); },
    // ファイル選択を開き、選ばれたファイルを読み込む
    async importSaves() {
      const prefixes = await prefixesReady;
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.addEventListener('change', () => {
        const file = input.files && input.files[0];
        if (file) importSaves(file, prefixes);
      });
      input.click();
    },
    // テスト用: ファイルを直接渡して読み込む
    async importFile(file) { importSaves(file, await prefixesReady); },
  };
})();
