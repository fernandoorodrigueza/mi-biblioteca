// Mi Biblioteca — Service Worker
// Caches the app shell for offline use

const CACHE = 'biblioteca-v1';
const PRECACHE = [
  './biblioteca.html',
  'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Crimson+Pro:ital,wght@0,300;0,400;1,300;1,400&family=DM+Mono:wght@300;400&display=swap'
];

// Install: cache app shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for app shell, network-first for covers
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Book covers from Open Library — network only (don't cache, they're huge)
  if (url.hostname === 'covers.openlibrary.org') {
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // Open Library API — network only
  if (url.hostname === 'openlibrary.org') {
    e.respondWith(fetch(e.request).catch(() => new Response('[]', { status: 503 })));
    return;
  }

  // Google Fonts — stale-while-revalidate
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          const fresh = fetch(e.request).then(res => { cache.put(e.request, res.clone()); return res; });
          return cached || fresh;
        })
      )
    );
    return;
  }

  // Everything else — cache first, fall back to network
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (res.ok) {
        caches.open(CACHE).then(cache => cache.put(e.request, res.clone()));
      }
      return res;
    }))
  );
});
