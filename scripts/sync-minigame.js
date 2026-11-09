// C:\Claude\minigame の公開用ファイル（dist/client）を ALLGAME/minigame にコピーする。
// npm run dist の前に自動で実行される。元フォルダがなければ今あるコピーをそのまま使う。
const fs = require('fs');
const path = require('path');

const SRC = process.env.MINIGAME_SRC || 'C:/Claude/minigame/dist/client';
const DEST = path.join(__dirname, '..', 'minigame');

if (!fs.existsSync(SRC)) {
  console.log(`[sync-minigame] ${SRC} が見つからないため、既存のコピーを使います`);
  process.exit(0);
}
fs.rmSync(DEST, { recursive: true, force: true });
fs.cpSync(SRC, DEST, { recursive: true });
console.log(`[sync-minigame] ${SRC} → ${DEST} にコピーしました`);
