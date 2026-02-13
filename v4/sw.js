const CACHE_NAME = 'cc-v4-cache-v3';
const ASSETS = [
  './',
  './index.html',
  './favicon.svg',
  './manifest.json',
  './css/tokens.css',
  './css/reset.css',
  './css/layout.css',
  './css/components.css',
  './css/views.css',
  './js/app.js',
  './js/router.js',
  './js/mock-data.js',
  './js/components/sidebar.js',
  './js/components/theme-toggle.js',
  './js/components/command-palette.js',
  './js/components/slide-over.js',
  './js/views/dashboard.js',
  './js/views/projects.js',
  './js/views/project-detail.js',
  './js/views/board.js',
  './js/views/activity.js',
  './js/views/agents.js',
  './js/views/settings.js',
  './js/views/task-detail.js',
  './js/components/task-form.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Network-first for navigation, cache-first for assets
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Don't cache non-ok or opaque responses
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      });
    })
  );
});
