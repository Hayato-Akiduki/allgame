const { app, BrowserWindow, Menu, protocol, net, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const games = require('./games');
const { createLocalApi } = require('./local-api');

const ROOT = path.join(__dirname, '..');
const VENDOR = path.join(__dirname, 'vendor');

// 各ゲームを app://<id>/ で配信する。ゲームごとに別の保存領域（localStorage）になる。
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } },
]);

// ネットから読み込んでいたライブラリを同梱ファイルに差し替える（オフラインでも動くように）
const VENDOR_MAP = {
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js': 'three.r128.min.js',
};

function resolveFile(url) {
  const u = new URL(url);
  const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '');
  let base;
  if (u.host === 'menu') {
    base = path.join(__dirname, 'menu');
  } else {
    const game = games.find((g) => g.id === u.host);
    if (!game) return null;
    base = path.join(ROOT, path.dirname(game.path));
  }
  const file = path.normalize(path.join(base, rel || 'index.html'));
  if (!file.startsWith(base)) return null; // フォルダ外へのアクセスを防ぐ
  return file;
}

function gameUrl(game) {
  return `app://${game.id}/${encodeURIComponent(path.basename(game.path))}`;
}

const MENU_URL = 'app://menu/index.html';
let win;

function buildMenu() {
  const template = [
    {
      label: 'ゲーム',
      submenu: [
        { label: 'ゲーム一覧に戻る', accelerator: 'Alt+Home', click: () => win.loadURL(MENU_URL) },
        { type: 'separator' },
        ...games.map((g) => ({ label: g.title, click: () => win.loadURL(gameUrl(g)) })),
        { type: 'separator' },
        { role: 'quit', label: '終了' },
      ],
    },
    {
      label: '表示',
      submenu: [
        { role: 'togglefullscreen', label: '全画面表示', accelerator: 'F11' },
        { role: 'reload', label: '再読み込み', accelerator: 'F5' },
        { type: 'separator' },
        { role: 'resetZoom', label: '拡大率を戻す' },
        { role: 'zoomIn', label: '拡大' },
        { role: 'zoomOut', label: '縮小' },
        { type: 'separator' },
        { role: 'toggleDevTools', label: '開発者ツール' },
      ],
    },
    {
      label: 'ヘルプ',
      submenu: [{ label: `バージョン ${app.getVersion()}`, enabled: false }],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#0f1115',
    title: 'ALLGAME',
    icon: path.join(__dirname, 'icon.png'),
    autoHideMenuBar: false,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
    },
  });
  // ゲーム側の <title> でウィンドウ名が変わるので、アプリ名を前につける
  win.on('page-title-updated', (e, title) => {
    e.preventDefault();
    win.setTitle(title && !title.startsWith('app://') ? `${title} - ALLGAME` : 'ALLGAME');
  });
  // 外部リンクは既定のブラウザで開く
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.loadURL(MENU_URL);
}

app.whenReady().then(() => {
  // ミニゲームランドのランキング等はアプリ内で処理する（オフライン版）
  const localApi = createLocalApi(app.getPath('userData'));

  protocol.handle('app', (req) => {
    if (new URL(req.url).pathname === '/__games.json') {
      const list = games.map((g) => ({ ...g, url: gameUrl(g) }));
      return new Response(JSON.stringify({ version: app.getVersion(), games: list }), {
        headers: { 'content-type': 'application/json' },
      });
    }
    const u = new URL(req.url);
    const game = games.find((g) => g.id === u.host);
    if (game && game.localApi && u.pathname.startsWith('/api/')) return localApi.handle(req);
    const file = resolveFile(req.url);
    if (!file || !fs.existsSync(file)) return new Response('Not found', { status: 404 });
    // 文字コード指定のない HTML もあるので UTF-8 と明示する
    if (/\.html?$/i.test(file)) {
      return new Response(fs.readFileSync(file), { headers: { 'content-type': 'text/html; charset=utf-8' } });
    }
    return net.fetch(pathToFileURL(file).toString());
  });

  // CDN のライブラリへのリクエストは同梱ファイルを返す。それ以外の https は通常どおり。
  protocol.handle('https', (req) => {
    const local = VENDOR_MAP[req.url];
    if (local) return net.fetch(pathToFileURL(path.join(VENDOR, local)).toString());
    return net.fetch(req, { bypassCustomProtocolHandlers: true });
  });

  buildMenu();
  createWindow();
});

app.on('window-all-closed', () => app.quit());
