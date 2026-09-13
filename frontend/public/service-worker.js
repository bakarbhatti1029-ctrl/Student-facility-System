const CACHE_NAME = 'sfs-shell-v1';
const OFFLINE_PAGE_KEY = '/__sfs_offline_shell__';
const CORE_ASSETS = ['/', '/logo.png', '/manifest.json'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async cache => {
        await cache.addAll(CORE_ASSETS);
        const shell = await cache.match('/');
        const html = await shell.text();
        const compiledAssets = [...html.matchAll(/["'](\/static\/(?:css|js)\/[^"']+)["']/g)]
          .map(match => match[1]);
        await cache.addAll([...new Set(compiledAssets)]);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Pages use network-first so online users always receive the newest build.
  // The most recently loaded application shell is the offline fallback for
  // React Router URLs such as /booking and /kitchens.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(OFFLINE_PAGE_KEY, copy));
          }
          return response;
        })
        .catch(async () => (await caches.match(OFFLINE_PAGE_KEY)) || caches.match('/'))
    );
    return;
  }

  // Hashed CRA assets are immutable. Cache them after first use so Tailwind's
  // compiled CSS and the JavaScript bundle are available offline.
  if (url.pathname.startsWith('/static/') || CORE_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      }))
    );
  }
});
