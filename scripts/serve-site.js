// site-dist/ をこのPCで表示確認するための小さなサーバー（追加のインストール不要）。
//   node scripts/serve-site.js  → http://localhost:8800
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'site-dist');
const PORT = Number(process.env.PORT) || 8800;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml',
};

http.createServer((req, res) => {
  let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end('Not found');
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`http://localhost:${PORT} で表示中（Ctrl+C で終了）`));
