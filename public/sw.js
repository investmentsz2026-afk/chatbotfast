// Service Worker for Chatbot PWA
const CACHE_NAME = 'chatbot-v1';
const STATIC_ASSETS = [
  '/',
  '/icon-192.png',
  '/icon-512.png',
];

// Install - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch - network first, cache fallback for pages; cache first for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests, API calls and Admin panel routes
  if (
    event.request.method !== 'GET' || 
    url.pathname.startsWith('/api/') || 
    url.pathname.startsWith('/admin')
  ) {
    return;
  }

  // Cache-first for static assets
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|ico|css|js|woff2?)$/)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((response) => {
          const responseClone = response.clone();
          if (event.request.url.startsWith('http://') || event.request.url.startsWith('https://')) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Network-first for pages
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();
        if (event.request.url.startsWith('http://') || event.request.url.startsWith('https://')) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          return cached || caches.match('/');
        });
      })
  );
});
