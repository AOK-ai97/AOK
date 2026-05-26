// AOK PWA Service Worker — avtomatik yangilanish
// Har deploy da CACHE_VERSION ni o'zgartiring (yoki sana qo'ying)
const CACHE_VERSION = 'aok-v3-' + '2026-05-25-07';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// O'rnatish — yangi versiyani darhol faollashtirish
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(ASSETS))
  );
  // Yangi service worker darhol ishga tushsin (kutmasin)
  self.skipWaiting();
});

// Faollashtirish — barcha eski keshlarni o'chirish
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// So'rovlar — HTML uchun "avval tarmoq" (yangi versiyani oladi)
self.addEventListener('fetch', (e) => {
  // Tashqi so'rovlar (CDN) — tegmaymiz
  if (!e.request.url.startsWith(self.location.origin)) {
    return;
  }
  const url = new URL(e.request.url);
  const isHTML = e.request.mode === 'navigate' ||
                 url.pathname.endsWith('.html') ||
                 url.pathname.endsWith('/');

  if (isHTML) {
    // HTML — AVVAL TARMOQ: doim yangi versiyani oladi
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(e.request, clone));
          return response;
        })
        .catch(() => caches.match(e.request)) // internet yo'q — keshdan
    );
  } else {
    // Boshqa fayllar (ikonka) — avval kesh
    e.respondWith(
      caches.match(e.request).then((cached) => cached || fetch(e.request))
    );
  }
});

// Sahifaga "yangilanish tayyor" xabarini yuborish
self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
