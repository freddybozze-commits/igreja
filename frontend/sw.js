const CACHE_NAME = 'iepp-pwa-v20.0.0';
const APP_SHELL = [
  './',
  './index.html',
  './admin.html',
  './manifest.webmanifest',
  './css/styles.css',
  './css/admin.css',
  './js/app.js',
  './js/intro.js',
  './js/admin.js',
  './js/admin-service.js',
  './js/supabase-config.js',
  './js/supabase-service.js',
  './data/content.json',
  './assets/images/logo igreja.png',
  './assets/images/app_icon_silver.png',
  './assets/images/banner_conferencia.png',
  './assets/images/culto_familia.png',
  './assets/images/culto_oracao.png',
  './assets/images/ao_vivo.png',
  './assets/images/batismo.png',
  './assets/images/ministerio_kids.png',
  './assets/images/discipulado.png',
  './assets/videos/intro.mp4',
  './assets/icons/icon-silver-192.png',
  './assets/icons/icon-silver-512.png',
  './assets/icons/maskable-silver-192.png',
  './assets/icons/maskable-silver-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.endsWith('/data/content.json') || url.pathname.endsWith('/js/supabase-config.js')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('./index.html');
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    }))
  );
});
