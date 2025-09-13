// Script para limpiar completamente el cache y forzar recarga
console.log('🧹 Limpiando TODOS los caches y datos almacenados...');

// Función para limpiar localStorage
function clearLocalStorage() {
  const localStorageKeys = Object.keys(localStorage);
  console.log(`📦 localStorage tiene ${localStorageKeys.length} elementos`);
  
  localStorageKeys.forEach(key => {
    console.log(`🗑️ Removiendo localStorage: ${key}`);
    localStorage.removeItem(key);
  });
}

// Función para limpiar sessionStorage
function clearSessionStorage() {
  const sessionStorageKeys = Object.keys(sessionStorage);
  console.log(`📦 sessionStorage tiene ${sessionStorageKeys.length} elementos`);
  
  sessionStorageKeys.forEach(key => {
    console.log(`🗑️ Removiendo sessionStorage: ${key}`);
    sessionStorage.removeItem(key);
  });
}

// Función para limpiar caches de la API de Cache
async function clearCacheStorage() {
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      console.log(`💾 Encontrados ${cacheNames.length} caches`);
      
      await Promise.all(
        cacheNames.map(async (cacheName) => {
          console.log(`🗑️ Eliminando cache: ${cacheName}`);
          await caches.delete(cacheName);
        })
      );
      console.log('✅ Todos los caches eliminados');
    } catch (error) {
      console.error('❌ Error eliminando caches:', error);
    }
  }
}

// Función para desregistrar service workers
async function clearServiceWorkers() {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log(`🔧 Encontrados ${registrations.length} service workers`);
      
      await Promise.all(
        registrations.map(async (registration) => {
          console.log(`🗑️ Desregistrando service worker: ${registration.scope}`);
          await registration.unregister();
        })
      );
      console.log('✅ Todos los service workers desregistrados');
    } catch (error) {
      console.error('❌ Error desregistrando service workers:', error);
    }
  }
}

// Función principal
async function clearEverything() {
  console.log('🚀 Iniciando limpieza completa...');
  
  // Limpiar storages
  clearLocalStorage();
  clearSessionStorage();
  
  // Limpiar caches y service workers
  await clearCacheStorage();
  await clearServiceWorkers();
  
  console.log('✅ Limpieza completa terminada');
  console.log('🔄 Recargando página en 2 segundos...');
  
  // Forzar recarga completa
  setTimeout(() => {
    window.location.href = window.location.href + '?t=' + Date.now();
  }, 2000);
}

// Ejecutar limpieza
clearEverything();
