const CACHE_NAME = 'sakura-academy-shell-v1.5.21';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './issue-tracker.html',
  './PROGRESS.md',
  './DATA_SOURCES.md',
  './src/n5-data.js',
  './src/content.js',
  './src/n5-app.js',
  './src/content-validation.js',
  './src/lesson-progress.js',
  './src/reward-guard.js',
  './src/app.js',
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith('sakura-academy-shell-') && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        const cachedPage = await caches.match(request, { ignoreSearch: true });
        if (cachedPage) return cachedPage;
        const appIndex = new URL('./index.html', self.registration.scope).href;
        return await caches.match(appIndex) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  })());
});
