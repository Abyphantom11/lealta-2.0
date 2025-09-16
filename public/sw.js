// Service Worker optimizado para PWA en Chrome
const CACHE_NAME = 'lealta-2-0-v1.0.3';
const urlsToCache = [
  '/',
  '/cliente',
  '/manifest.json',
  '/icons/icon-base.svg',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

// Instalación del service worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker instalándose');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('🚀 Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
  // Forzar activación inmediata
  self.skipWaiting();
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

// Interceptar requests con estrategia de "Network first, fallback to cache"
self.addEventListener('fetch', (event) => {
  // Skip caching for API routes to evitar problemas
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request).catch(() => {
      return new Response(JSON.stringify({ error: 'Sin conexión', offline: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }));
    return;
  }

  // Skip caching for contenido dinámico
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
              // Si no hay cache, muestra página offline
              return caches.match('/offline.html')
                .then(offlineResponse => {
                  return offlineResponse || new Response(
                    'Sin conexión. Por favor intenta más tarde.',
                    { headers: { 'Content-Type': 'text/html' } }
                  );
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
          // Devuelve desde caché si existe
          return cachedResponse;
        }
        
        // Si no existe en caché, busca en red
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
            // Manejo según tipo de asset
            if (event.request.url.match(/\.(jpg|jpeg|png|gif|svg)$/)) {
              return new Response('', { 
                headers: { 'Content-Type': 'image/svg+xml' }
              });
            }
            return new Response('Error de conexión');
          });
      })
  );
});

// Evento de sincronización en background
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-consumos') {
    console.log('🔄 Sincronizando consumos pendientes');
    event.waitUntil(syncPendingConsumptions());
  }
});

// Función para sincronizar consumos pendientes
async function syncPendingConsumptions() {
  try {
    // Aquí iría la lógica para recuperar consumos pendientes
    // del IndexedDB y enviarlos al servidor
    console.log('✅ Sincronización completada');
  } catch (error) {
    console.error('❌ Error al sincronizar:', error);
  }
}
