const CACHE_NAME = 'fasting-flow-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache).catch(err => {
        console.log('⚠️ Cache addAll failed (this is OK for some environments):', err);
      });
    }).catch(err => {
      console.log('⚠️ Cache open failed:', err);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).catch(err => {
      console.log('⚠️ Activate error:', err);
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other unsupported protocols
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response;
      }

      return fetch(event.request).then(response => {
        // Don't cache non-GET or non-successful responses
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Clone response and cache it
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache).catch(err => {
            console.log('⚠️ Cache put failed (this is OK for some environments):', err);
          });
        }).catch(err => {
          console.log('⚠️ Cache open failed:', err);
        });

        return response;
      }).catch(() => {
        // Return cached version if fetch fails
        return caches.match(event.request);
      });
    }).catch(err => {
      console.log('⚠️ Fetch error:', err);
    })
  );
});
