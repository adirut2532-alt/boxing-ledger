const CACHE_NAME = 'boxing-ledger-cache-v5';
const ASSETS = [
  'index.html', 'style.css', 'script.js', 'manifest.json',
  'assets/icon-192.png', 'assets/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key.startsWith('boxing-ledger-cache-') && key !== CACHE_NAME)
        .map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

// Prefer current files online; retain cached files for offline use.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin ||
      !url.href.startsWith(self.registration.scope)) return;

  const response = fetch(event.request, { cache: 'no-cache' });
  event.waitUntil(response.then(async result => {
    if (result.ok) {
      const copy = result.clone();
      const cache = await caches.open(CACHE_NAME);
      await cache.put(event.request, copy);
    }
  }).catch(() => {}));
  event.respondWith(response.catch(async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(event.request);
    if (cached) return cached;
    if (event.request.mode === 'navigate') {
      const page = await cache.match(new URL('index.html', self.registration.scope));
      if (page) return page;
    }
    return Response.error();
  }));
});
