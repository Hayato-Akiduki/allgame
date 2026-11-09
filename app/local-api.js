// ミニゲームランドのオフライン版用 API。
// 本来はサーバー（Cloudflare Workers）が返す /api/* をアプリ内で返す。
// 記録はこのPCの userData/minigame-records.json に保存し、ランキングは「自分の記録」になる。
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MAX_SCORES = 5000;

function createLocalApi(dataDir) {
  const file = path.join(dataDir, 'minigame-records.json');
  let data = null;

  function load() {
    if (data) return data;
    try {
      data = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      data = {};
    }
    data.playerId ||= crypto.randomUUID();
    data.profile ||= null;
    data.scores = Array.isArray(data.scores) ? data.scores : [];
    return data;
  }

  function save() {
    fs.mkdirSync(dataDir, { recursive: true });
    const tmp = file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data));
    fs.renameSync(tmp, file);
  }

  function json(body, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    });
  }

  const int = (v, min, max) => Number.isSafeInteger(v) && v >= min && v <= max;
  const text = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

  function updateProfile(body) {
    const d = load();
    const prev = d.profile || {};
    d.profile = {
      username: text(body.username, 16) || prev.username || 'プレイヤー',
      avatar: text(body.avatar, 8) || prev.avatar || '🎮',
      level: int(body.level, 1, 1000) ? body.level : prev.level || 1,
      totalPoints: int(body.totalPoints, 0, 1e9) ? body.totalPoints : prev.totalPoints || 0,
      updatedAt: new Date().toISOString(),
    };
  }

  function rankings(url) {
    const d = load();
    const p = d.profile || { username: 'プレイヤー', avatar: '🎮', level: 1, totalPoints: 0, updatedAt: new Date().toISOString() };
    const me = { playerId: d.playerId, username: p.username, avatar: p.avatar };
    const type = url.searchParams.get('type') || 'game';

    if (type === 'level' || type === 'points') {
      return json({ type, rows: d.profile ? [{ ...me, level: p.level, totalPoints: p.totalPoints, updatedAt: p.updatedAt }] : [] });
    }
    if (type === 'earned') {
      if (!d.scores.length) return json({ type, rows: [] });
      const totalScore = d.scores.reduce((sum, s) => sum + s.score, 0);
      return json({ type, rows: [{ ...me, totalScore, updatedAt: d.scores[0].playedAt }] });
    }
    if (type !== 'game') return json({ error: 'Unknown ranking type' }, 400);

    // ゲーム別: 自分のスコア上位10件
    const gameId = url.searchParams.get('gameId');
    const rulesVersion = Number(url.searchParams.get('rulesVersion')) || 1;
    const rows = d.scores
      .filter((s) => s.gameId === gameId && s.rulesVersion === rulesVersion)
      .sort((a, b) => b.score - a.score || a.playedAt.localeCompare(b.playedAt))
      .slice(0, 10)
      .map((s) => ({ ...me, score: s.score, playedAt: s.playedAt }));
    return json({ rows });
  }

  async function handle(req) {
    const url = new URL(req.url);
    const route = `${req.method} ${url.pathname}`;
    try {
      if (route === 'GET /api/rankings') return rankings(url);
      if (route === 'POST /api/session') return json({ playerId: load().playerId }, 201);

      const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
      if (route === 'POST /api/profile') {
        updateProfile(body);
        save();
        return json({ ok: true }, 201);
      }
      if (route === 'POST /api/scores') {
        if (typeof body.gameId !== 'string' || !int(body.score, 0, 1e9)) return json({ error: 'Invalid score' }, 400);
        const d = load();
        d.scores.unshift({
          gameId: text(body.gameId, 32),
          score: body.score,
          won: !!body.won,
          rulesVersion: int(body.rulesVersion, 1, 100) ? body.rulesVersion : 1,
          playedAt: new Date().toISOString(),
        });
        d.scores = d.scores.slice(0, MAX_SCORES);
        updateProfile(body);
        save();
        return json({ ok: true }, 201);
      }
      return json({ error: 'Not found' }, 404);
    } catch (error) {
      console.error('[local-api]', error);
      return json({ error: 'Server error' }, 500);
    }
  }

  return { handle };
}

module.exports = { createLocalApi };
