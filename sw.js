const CACHE_NAME = 'vacodir-cache-v1';
const OFFLINE_URL = '/index.html';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

// Instalación: precache
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
});

// Activación: limpiar caches antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Estrategias de fetch
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Manejar navegación: network-first (sirve siempre la última versión; fallback a cached offline)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // opcional: cachear la última index
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(OFFLINE_URL, copy));
          return response;
        })
        .catch(() =>
          caches.match(OFFLINE_URL)
        )
    );
    return;
  }

  // Fonts y recursos de terceros: stale-while-revalidate
  if (url.origin.includes('fonts.googleapis.com') || url.origin.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const networkFetch = fetch(request).then((resp) => {
          if (resp && resp.status === 200) cache.put(request, resp.clone());
          return resp;
        }).catch(() => null);
        return cached || networkFetch;
      })
    );
    return;
  }

  // Assets estáticos: cache-first (fall back to network)
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      // opcional: cachea recursos GET de mismo origen
      if (request.method === 'GET' && url.origin === self.location.origin) {
        caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
      }
      return response;
    }).catch(() => {
      // fallback genérico: si es una imagen devuelve un placeholder o una respuesta vacía
      if (request.destination === 'image') {
        return new Response('', { headers: { 'Content-Type': 'image/svg+xml' } });
      }
      return caches.match(OFFLINE_URL);
    }))
  );
});
