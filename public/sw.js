// Service Worker optimizado para PWA móvil
const CACHE_NAME = 'lealta-2-0-v1.0.4';
const urlsToCache = [
  '/',
  '/offline.html'
];

// Instalación del service worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker instalándose');
  
  // Forzar activación inmediata
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('🚀 Cache abierto');
        // No fallar si algún recurso no se puede cachear
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => 
              console.warn(`No se pudo cachear ${url}:`, err)
            )
          )
        );
      })
      .then(() => {
        console.log('✅ Service Worker instalado correctamente');
      })
  );
});

// Activación del service worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activado');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
          return null;
        }).filter(Boolean)
      );
    })
    .then(() => {
      // Tomar control de todos los clientes inmediatamente
      return self.clients.claim();
    })
  );
});

// Interceptar requests con estrategia optimizada para móviles
self.addEventListener('fetch', (event) => {
  // Skip caching para API routes
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ error: 'Sin conexión', offline: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Solo GET requests
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Estrategia "Network first, fallback to cache" para HTML
  if (event.request.headers.get('Accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache respuesta para uso futuro
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          // Si falla la red, intenta desde cache
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Página offline básica
              return new Response(`<!DOCTYPE html>
<html>
<head>
  <title>Sin conexión - Lealta</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #1a1a1a; color: white; }
    .container { max-width: 400px; margin: 0 auto; }
    .icon { font-size: 64px; margin-bottom: 20px; }
    h1 { color: #3b82f6; }
    button { background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 5px; margin-top: 20px; cursor: pointer; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📱</div>
    <h1>Sin conexión</h1>
    <p>No hay conexión a internet. Revisa tu conexión e intenta nuevamente.</p>
    <button onclick="window.location.reload()">Reintentar</button>
  </div>
</body>
</html>`, {
                headers: { 'Content-Type': 'text/html' }
              });
            });
        })
    );
    return;
  }

  // Estrategia "Cache first, fallback to network" para assets estáticos
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(event.request)
          .then(response => {
            // Cache respuesta para uso futuro
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, clonedResponse);
            });
            return response;
          })
          .catch(error => {
            console.error('Error en fetch:', error);
            return new Response('Error de conexión');
          });
      })
  );
});

// Mensaje desde la aplicación principal
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Manejar actualización de manifest dinámico
  if (event.data && event.data.type === 'MANIFEST_UPDATED') {
    const businessSlug = event.data.businessSlug;
    console.log('🔧 SW: Manifest actualizado para business:', businessSlug);
    
    // Notificar a todos los clientes sobre el cambio de manifest
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'MANIFEST_READY',
          businessSlug: businessSlug,
          manifestUrl: businessSlug 
            ? `/api/manifest?business=${encodeURIComponent(businessSlug)}`
            : '/api/manifest'
        });
      });
    });
  }
});

console.log('🚀 Service Worker cargado - versión', CACHE_NAME);
