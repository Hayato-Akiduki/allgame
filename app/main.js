const { app, BrowserWindow, Menu, dialog, net, protocol } = require('electron');
const { stat } = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { autoUpdater } = require('electron-updater');

const ROOT = path.join(__dirname, '..', 'site-dist');
const HOME = 'app://menu/';
const ONLINE_ORIGIN = 'https://mini-game-land.akiduki2ha46.workers.dev';
const UPDATE_INTERVAL = 4 * 60 * 60 * 1000;
let window;
let updateCheck;
let updateReady = false;

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } },
]);

async function serveAsset(request) {
  const url = new URL(request.url);
  if (url.host !== 'menu') return new Response('Not found', { status: 404 });

  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return new Response('Bad request', { status: 400 });
  }
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = path.resolve(ROOT, `.${pathname}`);
  const relative = path.relative(ROOT, file);
  if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)
      || /[:\\\u0000]/.test(pathname)) {
    return new Response('Not found', { status: 404 });
  }
  const info = await stat(file).catch(() => null);
  if (!info?.isFile()) return new Response('Not found', { status: 404 });
  const response = await net.fetch(pathToFileURL(file).href, { headers: request.headers });
  if (path.extname(file) !== '.html') return response;
  const headers = new Headers(response.headers);
  headers.set('content-type', 'text/html; charset=utf-8');
  return new Response(response.body, { status: response.status, headers });
}

function isAllowedPage(target) {
  const url = new URL(target);
  return (url.protocol === 'app:' && url.host === 'menu') || url.origin === ONLINE_ORIGIN;
}

function goHome() {
  window?.loadURL(HOME).catch(error => console.error(error));
}

function createWindow() {
  window = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'ALLGAME',
    backgroundColor: '#0f1115',
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false },
  });
  const guard = (event, target) => {
    if (!isAllowedPage(event.url ?? target)) event.preventDefault();
  };
  window.webContents.on('will-navigate', guard);
  window.webContents.on('will-redirect', guard);
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.on('closed', () => { window = null; });
  goHome();
}

async function promptToRestart() {
  if (!window) return;
  const { response } = await dialog.showMessageBox(window, {
    type: 'info',
    message: '更新の準備ができました',
    detail: '通常終了したときに更新します。今すぐ更新する場合は、ゲームをセーブしてから再起動してください。',
    buttons: ['あとで', '今すぐ再起動'],
    defaultId: 0,
    cancelId: 0,
  });
  if (response === 1) autoUpdater.quitAndInstall(false, true);
}

async function checkForUpdates(manual = false) {
  if (!app.isPackaged) {
    if (manual && window) await dialog.showMessageBox(window, { message: '更新はインストール版で利用できます。' });
    return;
  }
  if (updateReady) {
    if (manual) await promptToRestart();
    return;
  }
  if (updateCheck) return;

  try {
    updateCheck = autoUpdater.checkForUpdates();
    const result = await updateCheck;
    if (result?.downloadPromise) await result.downloadPromise;
    else if (manual && window) await dialog.showMessageBox(window, { message: '利用できる更新はありません。' });
  } catch (error) {
    console.error('Update failed:', error.message);
    if (manual && window) {
      await dialog.showMessageBox(window, {
        type: 'warning',
        message: '更新を確認または取得できませんでした',
        detail: 'ネット接続を確認し、時間をおいてもう一度お試しください。',
      });
    }
  } finally {
    updateCheck = null;
  }
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (window?.isMinimized()) window.restore();
    window?.focus();
  });
  app.whenReady().then(() => {
    protocol.handle('app', serveAsset);
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      { label: 'ゲーム', submenu: [
        { label: 'ゲーム一覧に戻る', accelerator: 'Alt+Home', click: goHome },
        { type: 'separator' },
        { label: '終了', role: 'quit' },
      ] },
      { label: '表示', submenu: [
        { label: '全画面表示', role: 'togglefullscreen', accelerator: 'F11' },
      ] },
      { label: 'ヘルプ', submenu: [
        { label: '更新を確認', click: () => { void checkForUpdates(true); } },
        { label: `バージョン ${app.getVersion()}`, enabled: false },
      ] },
    ]));
    createWindow();

    if (app.isPackaged) {
      autoUpdater.autoDownload = true;
      autoUpdater.autoInstallOnAppQuit = true;
      autoUpdater.allowPrerelease = false;
      autoUpdater.on('update-downloaded', () => {
        updateReady = true;
        void promptToRestart().catch(error => console.error(error));
      });
      void checkForUpdates();
      setInterval(() => { void checkForUpdates(); }, UPDATE_INTERVAL).unref();
    }
  });
  app.on('window-all-closed', () => app.quit());
}
