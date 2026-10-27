const CACHE_NAME = 'beckys-hardware-v3';

const STATIC_ASSETS = [
  '/',
  '/login',
  '/pos',
  '/catalogue',
  '/inventory',
  '/purchases',
  '/customers',
  '/suppliers',
  '/payments',
  '/returns',
  '/expenses',
  '/reports',
  '/audit-logs',
  '/settings',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/screenshot-wide.png',
  '/screenshot-narrow.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Pre-caching partial static assets:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip caching remote third-party APIs (Supabase Auth/REST should fail fast to Dexie offline fallback)
  if (url.origin !== self.location.origin) {
    return;
  }

  // HTML page navigation requests: Network-first, fallback to cache, fallback to /pos or /
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedPage = await caches.match(event.request);
          if (cachedPage) return cachedPage;

          // Fallback to POS or home shell if specific sub-route was not explicitly cached
          const posFallback = await caches.match('/pos');
          if (posFallback) return posFallback;

          const homeFallback = await caches.match('/');
          if (homeFallback) return homeFallback;

          return new Response('Offline: Becky\'s Hardware Store is available in offline mode.', {
            headers: { 'Content-Type': 'text/plain' },
          });
        })
    );
    return;
  }

  // Static Assets (_next/static, images, icons): Cache-first with background revalidation
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
