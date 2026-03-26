// Mi Biblioteca — Service Worker v3
const CACHE_VERSION = 3;
const CACHE = `biblioteca-v${CACHE_VERSION}`;
const PRECACHE = ['./', './index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const networkOnly = ['firestore.googleapis.com','firebase.googleapis.com','identitytoolkit.googleapis.com','securetoken.googleapis.com','covers.openlibrary.org','openlibrary.org','www.gstatic.com'];
  if (networkOnly.includes(url.hostname)) {
    e.respondWith(fetch(e.request).catch(()=>new Response('',{status:503})));
    return;
  }
  if (url.hostname==='fonts.googleapis.com'||url.hostname==='fonts.gstatic.com') {
    e.respondWith(caches.open(CACHE).then(c=>c.match(e.request).then(cached=>{const f=fetch(e.request).then(r=>{c.put(e.request,r.clone());return r;});return cached||f;})));
    return;
  }
  e.respondWith(fetch(e.request).then(r=>{if(r.ok)caches.open(CACHE).then(c=>c.put(e.request,r.clone()));return r;}).catch(()=>caches.match(e.request)));
});
