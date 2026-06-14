const CACHE_NAME = 'boxing-ledger-cache-v4';
const ASSETS = [
  'index.html',
  'style.css',
  'script.js',
  'manifest.json',
  'assets/icon-192.png',
  'assets/icon-512.png'
];

// Install Event - cache core resources
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching assets...');
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - clean up old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache...', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Cache First / Network Fallback Strategy
self.addEventListener('fetch', (e) => {
  // Only intercept requests for same-origin resources
  if (e.request.url.startsWith(self.location.origin)) {
    e.respondWith(
      caches.match(e.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(e.request).then((networkResponse) => {
          // Cache new responses dynamically
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, responseClone);
            });
          }
          return networkResponse;
        }).catch(() => {
          // Offline fallback if network fails
          console.log('Network request failed, resource not in cache.');
        });
      })
    );
  }
});
