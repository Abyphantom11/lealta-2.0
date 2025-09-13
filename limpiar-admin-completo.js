// ===========================================
// 🧹 SCRIPT DE LIMPIEZA COMPLETA DEL ADMIN
// ===========================================
// Ejecuta este script en la consola del navegador para eliminar TODOS los datos cached

console.log('🚀 INICIANDO LIMPIEZA COMPLETA DEL ADMIN DASHBOARD');
console.log('=' .repeat(60));

// 1. LIMPIAR TODOS LOS LOCAL STORAGE
console.log('📦 1. Limpiando localStorage...');
const localKeys = Object.keys(localStorage);
console.log(`   Encontrados ${localKeys.length} elementos en localStorage`);
localKeys.forEach(key => {
  console.log(`   🗑️ Eliminando: ${key}`);
  localStorage.removeItem(key);
});
console.log('   ✅ localStorage limpiado completamente');

// 2. LIMPIAR TODOS LOS SESSION STORAGE
console.log('📦 2. Limpiando sessionStorage...');
const sessionKeys = Object.keys(sessionStorage);
console.log(`   Encontrados ${sessionKeys.length} elementos en sessionStorage`);
sessionKeys.forEach(key => {
  console.log(`   🗑️ Eliminando: ${key}`);
  sessionStorage.removeItem(key);
});
console.log('   ✅ sessionStorage limpiado completamente');

// 3. LIMPIAR CACHE API
console.log('💾 3. Limpiando Cache API...');
if ('caches' in window) {
  caches.keys().then(cacheNames => {
    console.log(`   Encontrados ${cacheNames.length} caches`);
    return Promise.all(
      cacheNames.map(cacheName => {
        console.log(`   🗑️ Eliminando cache: ${cacheName}`);
        return caches.delete(cacheName);
      })
    );
  }).then(() => {
    console.log('   ✅ Todos los caches eliminados');
  });
} else {
  console.log('   ⚠️ Cache API no disponible en este navegador');
}

// 4. DESREGISTRAR SERVICE WORKERS
console.log('🔧 4. Limpiando Service Workers...');
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log(`   Encontrados ${registrations.length} service workers`);
    return Promise.all(
      registrations.map(registration => {
        console.log(`   🗑️ Desregistrando: ${registration.scope}`);
        return registration.unregister();
      })
    );
  }).then(() => {
    console.log('   ✅ Todos los service workers desregistrados');
  });
} else {
  console.log('   ⚠️ Service Workers no disponibles en este navegador');
}

// 5. LIMPIAR COOKIES RELACIONADAS CON ADMIN
console.log('🍪 5. Limpiando cookies...');
document.cookie.split(";").forEach(function(c) { 
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});
console.log('   ✅ Cookies limpiadas');

// 6. ELIMINAR VARIABLES GLOBALES RELACIONADAS
console.log('🌐 6. Limpiando variables globales...');
if (window.adminDashboardData) {
  delete window.adminDashboardData;
  console.log('   🗑️ Eliminada window.adminDashboardData');
}
if (window.dashboardCache) {
  delete window.dashboardCache;
  console.log('   🗑️ Eliminada window.dashboardCache');
}
if (window.adminCache) {
  delete window.adminCache;
  console.log('   🗑️ Eliminada window.adminCache');
}
console.log('   ✅ Variables globales limpiadas');

// 7. MENSAJE FINAL Y RECARGA
console.log('=' .repeat(60));
console.log('✅ LIMPIEZA COMPLETA FINALIZADA');
console.log('🔄 Recargando página en 3 segundos...');
console.log('📋 Si los datos persisten, verifica:');
console.log('   • Que estás en la ruta /admin (no /superadmin)');
console.log('   • Que no hay múltiples pestañas abiertas');
console.log('   • Que el servidor de desarrollo se reinició');

// RECARGA FORZADA
setTimeout(() => {
  console.log('🔄 Recargando ahora...');
  // Usar location.replace para evitar cache del navegador
  window.location.replace(window.location.href + '?cache_bust=' + Date.now());
}, 3000);
