// 日本一周ドライブ3D（C# の exe）を ALLGAME/native/japandrive にコピーする。
// npm run dist の前に自動で実行される。元ファイルがなければ今あるコピーをそのまま使う。
// 元の exe は C:\Claude\日本一周 で dotnet publish したもの（配布フォルダ）。
const fs = require('fs');
const path = require('path');

const SRC = process.env.JAPANDRIVE_SRC || 'C:/Claude/日本一周/配布/日本一周ドライブ3D';
const DEST = path.join(__dirname, '..', 'native', 'japandrive');

if (!fs.existsSync(path.join(SRC, 'JapanDrive3D.exe'))) {
  console.log(`[sync-japandrive] ${SRC} に JapanDrive3D.exe が見つからないため、既存のコピーを使います`);
  process.exit(0);
}
fs.rmSync(DEST, { recursive: true, force: true });
fs.cpSync(SRC, DEST, { recursive: true });
console.log(`[sync-japandrive] ${SRC} → ${DEST} にコピーしました`);
