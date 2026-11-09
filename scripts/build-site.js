// HTML のゲームをまとめた Web サイトを site-dist/ に組み立てる。
//   npm run site       … 組み立てるだけ
//   npm run site:serve … 組み立ててこのPCで表示確認（http://localhost:8800）
//
// - 各ゲームは <id>/index.html に置く（日本語のファイル名を URL に出さないため）
// - exe のゲーム（native）はサイトには入れない
// - webUrl があるゲーム（ミニゲームランド）は公開中のサイトへのリンクにする
// - トップページはアプリのゲーム選択画面（app/menu/index.html）をそのまま使う
// - 各ゲームの HTML に共通スクリプト（site/hub.js：一覧へ戻るタブなど）を読み込ませる
const fs = require('fs');
const path = require('path');
const games = require('../app/games');
const pkg = require('../package.json');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'site-dist');
// サイトに載せないもの（開発用の設定・メモ、MONEY-WARS のバランス調整ツール）
const SKIP = new Set(['.claude', '.git', '.gitignore', 'README.md', 'balance']);

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// 各ゲームの HTML の最後に共通スクリプトを読み込ませる（元のファイルは変えない）
function injectHub(htmlFile) {
  const tag = '<script src="../hub.js"></script>';
  let html = fs.readFileSync(htmlFile, 'utf8');
  const i = html.toLowerCase().lastIndexOf('</body>');
  html = i >= 0 ? html.slice(0, i) + tag + '\n' + html.slice(i) : html + '\n' + tag + '\n';
  fs.writeFileSync(htmlFile, html);
}

const list = [];
for (const g of games) {
  if (g.native) continue;
  if (g.webUrl) {
    list.push({ id: g.id, title: g.title, genre: g.genre, color: g.color, url: g.webUrl, external: true });
    continue;
  }
  const src = path.join(ROOT, g.path);
  const dest = path.join(OUT, g.id);
  const dir = path.dirname(g.path);
  if (dir !== '.') {
    // フォルダごとのゲーム: 中身を丸ごとコピーし、入口の HTML を index.html にする
    fs.cpSync(path.join(ROOT, dir), dest, {
      recursive: true,
      filter: (p) => !SKIP.has(path.basename(p)),
    });
    fs.renameSync(path.join(dest, path.basename(g.path)), path.join(dest, 'index.html'));
  } else {
    fs.mkdirSync(dest, { recursive: true });
    fs.copyFileSync(src, path.join(dest, 'index.html'));
  }
  injectHub(path.join(dest, 'index.html'));
  list.push({ id: g.id, title: g.title, genre: g.genre, color: g.color, url: `${g.id}/` }); // 相対パス（GitHub Pages のサブフォルダでも動くように）
}

// トップページ: アプリのゲーム選択画面に、サイト版だけのプレイ記録（dashboard.js）を足す
const menuHtml = fs.readFileSync(path.join(ROOT, 'app', 'menu', 'index.html'), 'utf8');
fs.writeFileSync(path.join(OUT, 'index.html'), menuHtml.replace('<script>', '<script src="dashboard.js"></script>\n<script>'));
fs.copyFileSync(path.join(ROOT, 'site', 'dashboard.js'), path.join(OUT, 'dashboard.js'));
fs.copyFileSync(path.join(ROOT, 'build', 'icon.png'), path.join(OUT, 'icon.png'));
fs.copyFileSync(path.join(ROOT, 'site', 'hub.js'), path.join(OUT, 'hub.js'));
// GitHub Pages が「_ で始まるファイル」を無視しないようにする
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
fs.writeFileSync(path.join(OUT, '__games.json'), JSON.stringify({ version: pkg.version, games: list }));

console.log(`[build-site] ${list.length} 本のゲームで site-dist/ を作りました`);
