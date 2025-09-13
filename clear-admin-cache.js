// Script para limpiar cache del admin dashboard
console.log('🧹 Limpiando cache del admin dashboard...');

// Limpiar localStorage
localStorage.removeItem('admin-dashboard-cache');
localStorage.removeItem('dashboard-data');
localStorage.removeItem('admin-config');
localStorage.removeItem('portal-config');
localStorage.removeItem('visitas-data');
localStorage.removeItem('recompensas-cache');

// Limpiar sessionStorage
sessionStorage.removeItem('admin-dashboard-cache');
sessionStorage.removeItem('dashboard-data');
sessionStorage.removeItem('admin-config');
sessionStorage.removeItem('portal-config');
sessionStorage.removeItem('visitas-data');
sessionStorage.removeItem('recompensas-cache');

// Limpiar cualquier cache relacionado con métricas
Object.keys(localStorage).forEach(key => {
  if (key.includes('admin') || key.includes('dashboard') || key.includes('metric') || key.includes('stat')) {
    localStorage.removeItem(key);
    console.log(`Removido: ${key}`);
  }
});

Object.keys(sessionStorage).forEach(key => {
  if (key.includes('admin') || key.includes('dashboard') || key.includes('metric') || key.includes('stat')) {
    sessionStorage.removeItem(key);
    console.log(`Removido: ${key}`);
  }
});

console.log('✅ Cache limpiado. Recarga la página para ver cambios.');

// Forzar recarga sin cache
setTimeout(() => {
  window.location.reload(true);
}, 1000);
