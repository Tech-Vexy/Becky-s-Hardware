/**
 * Becky's Hardware Store — Service Worker
 * Version: 4.0.0
 *
 * Cache strategy:
 *  - App shell / navigation:  Network-first → cache fallback
 *  - Next.js static chunks:   Cache-first  → background revalidation (stale-while-revalidate)
 *  - Images & icons:          Cache-first  → background revalidation
 *  - External / Supabase API: Pass-through (never cached)
 *
 * Additional PWA features:
 *  - Background Sync ('becky-sync') to retry failed uploads when online
 *  - Periodic Background Sync ('becky-periodic-sync') for ambient refresh
 *  - Push notification handler with click-to-open
 *  - Automatic old-cache eviction on activate
 */

const CACHE_VERSION = 'v4';
const SHELL_CACHE   = `beckys-shell-${CACHE_VERSION}`;
const STATIC_CACHE  = `beckys-static-${CACHE_VERSION}`;
const IMAGE_CACHE   = `beckys-images-${CACHE_VERSION}`;

/** App-shell pages pre-cached on install */
const SHELL_URLS = [
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
  '/invoices',
  '/staff',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// ─── Install ────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) =>
        cache.addAll(SHELL_URLS).catch((err) => {
          // Pre-caching failures are non-fatal — SW still installs
          console.warn('[SW] Pre-cache partial failure:', err);
        })
      )
      .then(() => self.skipWaiting()) // Activate new SW immediately
  );
  console.log(`[SW] Installed ${SHELL_CACHE}`);
});

// ─── Activate ───────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  const ACTIVE_CACHES = [SHELL_CACHE, STATIC_CACHE, IMAGE_CACHE];

  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (!ACTIVE_CACHES.includes(key)) {
              console.log('[SW] Deleting stale cache:', key);
              return caches.delete(key);
            }
          })
        )
      )
      .then(() => self.clients.claim()) // Take control of all open tabs immediately
  );
  console.log(`[SW] Activated ${SHELL_CACHE}`);
});

// ─── Fetch ──────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // ── 1. Pass-through external origins (Supabase, CDNs, Google Fonts) ──────
  if (url.origin !== self.location.origin) {
    // Fonts: cache-first, long-lived
    if (url.hostname === 'fonts.gstatic.com' || url.hostname === 'fonts.googleapis.com') {
      event.respondWith(cacheFirst(request, STATIC_CACHE));
    }
    // Everything else: network only
    return;
  }

  // ── 2. Next.js static chunks (_next/static/) ─────────────────────────────
  //    These are content-hashed — safe to serve cache-first indefinitely.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // ── 3. Next.js data / RSC payloads (_next/data/, _rsc) ───────────────────
  //    Stale-while-revalidate — serve cache instantly, refresh in background.
  if (
    url.pathname.startsWith('/_next/data/') ||
    url.pathname.includes('.json') ||
    request.headers.get('RSC') === '1'
  ) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // ── 4. Images & icons ─────────────────────────────────────────────────────
  if (
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|gif)$/) ||
    url.pathname.startsWith('/icon')
  ) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  // ── 5. App-shell navigation (HTML pages) ─────────────────────────────────
  //    Network-first → cached shell fallback → offline placeholder
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  // ── 6. Everything else: stale-while-revalidate ───────────────────────────
  event.respondWith(staleWhileRevalidate(request, SHELL_CACHE));
});

// ─── Strategy helpers ────────────────────────────────────────────────────────

/** Cache-first: serve from cache, fall back to network, update cache in background */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return new Response('', { status: 503, statusText: 'Service Unavailable' });
  }
}

/** Stale-while-revalidate: serve cache instantly, refresh in background */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkFetch = fetch(request).then((response) => {
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);

  return cached ?? networkFetch;
}

/** Network-first: try network, fall back to cache, then offline shell */
async function networkFirst(request) {
  const cache = await caches.open(SHELL_CACHE);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    // Offline — try cached version of the exact URL
    const cachedPage = await cache.match(request);
    if (cachedPage) return cachedPage;

    // Fall back to cached POS (most useful offline screen)
    const posFallback = await cache.match('/pos');
    if (posFallback) return posFallback;

    // Final fallback: cached home shell
    const homeFallback = await cache.match('/');
    if (homeFallback) return homeFallback;

    return new Response(
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Becky's Hardware — Offline</title>
  <style>
    body { margin:0; font-family: system-ui, sans-serif; background:#0f172a; color:#f1f5f9;
           display:flex; align-items:center; justify-content:center; min-height:100vh; text-align:center; }
    .card { background:#1e293b; border-radius:1.25rem; padding:2rem 1.5rem; max-width:380px;
            border:1px solid #334155; }
    .icon { font-size:2.5rem; margin-bottom:1rem; }
    h1 { font-size:1.25rem; font-weight:800; margin:0 0 .5rem; }
    p { font-size:.875rem; color:#94a3b8; margin:.25rem 0; }
    .hint { margin-top:1.25rem; font-size:.75rem; color:#64748b; border-top:1px solid #334155;
            padding-top:1rem; }
    button { margin-top:1rem; background:#d97706; color:#451a03; border:none; border-radius:.75rem;
             padding:.625rem 1.25rem; font-size:.875rem; font-weight:700; cursor:pointer; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🔧</div>
    <h1>Becky's Hardware Store</h1>
    <p>You're currently <strong>offline</strong>.</p>
    <p>The POS, catalogue &amp; inventory are still available — tap a shortcut or reconnect to continue.</p>
    <button onclick="window.location.href='/pos'">Open POS Offline →</button>
    <p class="hint">All sales made offline will be synced to Supabase automatically when connection is restored.</p>
  </div>
</body>
</html>`,
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

// ─── Background Sync ─────────────────────────────────────────────────────────

self.addEventListener('sync', (event) => {
  if (event.tag === 'becky-sync') {
    console.log('[SW] Background sync triggered — notifying clients to flush queue');
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        for (const client of clients) {
          client.postMessage({ type: 'BACKGROUND_SYNC_TRIGGERED' });
        }
      })
    );
  }
});

// ─── Periodic Background Sync ────────────────────────────────────────────────

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'becky-periodic-sync') {
    console.log('[SW] Periodic background sync — refreshing shell cache');
    event.waitUntil(
      caches.open(SHELL_CACHE).then((cache) =>
        cache.addAll(SHELL_URLS).catch((err) =>
          console.warn('[SW] Periodic pre-cache refresh partial failure:', err)
        )
      )
    );
  }
});

// ─── Push Notifications ──────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  let data = {
    title: "Becky's Hardware",
    body: 'You have a new store notification.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'becky-push',
    url: '/',
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:  data.body,
      icon:  data.icon  || '/icon-192.png',
      badge: data.badge || '/icon-192.png',
      tag:   data.tag   || 'becky-push',
      data:  { url: data.url || '/' },
      vibrate: [200, 100, 200],
      requireInteraction: false,
      actions: [
        { action: 'open',    title: 'Open Store' },
        { action: 'dismiss', title: 'Dismiss'    },
      ],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Focus an already-open tab if possible
        for (const client of clients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});

// ─── Message handler (from app) ──────────────────────────────────────────────

self.addEventListener('message', (event) => {
  // App asking the waiting SW to take over immediately
  if (event.data?.type === 'SKIP_WAITING') {
    console.log('[SW] SKIP_WAITING received — activating new SW now');
    self.skipWaiting();
  }

  // Direct PWA notification trigger from app
  if (event.data?.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    if (self.registration && self.registration.showNotification) {
      self.registration.showNotification(title, options);
    }
  }
});
