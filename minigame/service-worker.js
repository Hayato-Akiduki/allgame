const CACHE_NAME = 'mini-game-land-v33';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/audio/ten-coins-left.mp3',
  '/css/app.css',
  '/js/bgm.js',
  '/js/input.js',
  '/js/core.js',
  '/js/init.js',
  '/js/games/memory.js',
  '/js/games/reaction.js',
  '/js/games/quiz.js',
  '/js/games/blackjack.js',
  '/js/games/hangman.js',
  '/js/games/slide.js',
  '/js/games/roulette.js',
  '/js/games/shiritori.js',
  '/js/games/tetris.js',
  '/js/games/breakout.js',
  '/js/games/monster.js',
  '/js/games/runner.js',
  '/js/games/minesweeper.js',
  '/js/games/shooting.js',
  '/js/games/slot.js',
  '/js/games/pachinko.js',
  '/js/games/pinball.js',
  '/js/games/snake.js',
  '/js/games/aimtrainer.js',
  '/js/games/pong.js',
  '/js/games/lightsout.js',
  '/js/games/reversi.js',
  '/js/games/sokoban.js',
  '/js/games/typing.js',
  '/js/games/simon.js',
  '/js/games/solitaire.js',
  '/js/games/fighter.js',
  '/js/puzzle-progress.js',
  '/js/games/pinpull.js',
  '/js/games/gaterunner.js',
  '/js/games/watersort.js',
  '/js/games/sudoku.js',
  '/js/games/minigolf.js',
  '/js/games/whackamole.js',
  '/js/games/highlow.js',
  '/js/games/blockpuzzle.js',
  '/js/games/fruitmerge.js',
  '/js/games/hitblow.js',
  '/js/main.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Scripts and styles change with every release and must match the page, so fetch them
  // fresh and fall back to the cache only when offline.
  if (/\.(js|css)$/.test(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    }))
  );
});
