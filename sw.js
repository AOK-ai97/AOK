// AOK PWA Service Worker — offline rejim
const CACHE_NAME = 'aok-v3-cache-1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// O'rnatish — fayllarni keshlash
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Faollashtirish — eski keshni tozalash
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// So'rovlarni boshqarish — avval kesh, keyin tarmoq
self.addEventListener('fetch', (e) => {
  // CDN va tashqi so'rovlarni o'tkazib yuborish
  if (!e.request.url.startsWith(self.location.origin)) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then((cached) => {
      return cached || fetch(e.request).then((response) => {
        // Yangi fayllarni keshga qo'shish
        return caches.open(CACHE_NAME).then((cache) => {
          if (e.request.method === 'GET' && response.status === 200) {
            cache.put(e.request, response.clone());
          }
          return response;
        });
      }).catch(() => cached);
    })
  );
});
