/**
 * Script específico para depurar "Love Me Sky"
 * Ejecuta este script en la consola del navegador cuando veas el banner fantasma
 */

console.log('🔍 === DEPURACIÓN LOVE ME SKY ===');

// Función para limpiar completamente el cache
async function cleanLoveMeSkyCache() {
  console.log('🧹 Iniciando limpieza completa del cache...');
  
  // 1. Limpiar localStorage
  const storageKeys = Object.keys(localStorage);
  const keysToDelete = storageKeys.filter(key => 
    key.includes('portal') || 
    key.includes('branding') || 
    key.includes('config') ||
    key.includes('love') ||
    key.includes('sky')
  );
  
  console.log('📦 Claves de localStorage a eliminar:', keysToDelete);
  keysToDelete.forEach(key => {
    localStorage.removeItem(key);
    console.log(`✅ Eliminado: ${key}`);
  });
  
  // 2. Limpiar cache del navegador
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    console.log('🗂️ Caches del navegador encontrados:', cacheNames);
    
    for (const cacheName of cacheNames) {
      if (cacheName.includes('portal') || cacheName.includes('api') || cacheName.includes('config')) {
        await caches.delete(cacheName);
        console.log(`✅ Cache eliminado: ${cacheName}`);
      }
    }
  }
  
  // 3. Forzar recarga de configuración
  console.log('🔄 Forzando recarga de configuración...');
  
  try {
    // Probar diferentes businessId
    const businessIds = ['love-me-sky', 'lovemesky', 'default'];
    
    for (const businessId of businessIds) {
      const response = await fetch(`/api/portal/config-v2?businessId=${businessId}&t=${Date.now()}&forceClear=true`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`📊 Config actualizada para ${businessId}:`, {
          success: data.success,
          banners: data.data?.banners?.length || 0,
          bannerTitles: data.data?.banners?.map(b => b.titulo) || []
        });
      }
    }
  } catch (error) {
    console.error('❌ Error recargando config:', error);
  }
  
  console.log('✅ Limpieza completa terminada. Recarga la página.');
}

// Función para inspeccionar el estado actual
function inspectCurrentState() {
  console.log('🔍 === ESTADO ACTUAL ===');
  
  // Inspeccionar elementos DOM
  const bannerElements = document.querySelectorAll('[class*="banner"]');
  console.log('🏷️ Elementos banner en DOM:', bannerElements.length);
  
  bannerElements.forEach((element, index) => {
    console.log(`  ${index + 1}.`, {
      element,
      text: element.textContent?.trim(),
      classes: element.className,
      src: element.querySelector('img')?.src
    });
  });
  
  // Inspeccionar localStorage
  console.log('📦 localStorage actual:');
  Object.keys(localStorage).forEach(key => {
    if (key.includes('portal') || key.includes('config') || key.includes('branding')) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        console.log(`  ${key}:`, data);
      } catch (e) {
        console.log(`  ${key}: (no JSON)`, localStorage.getItem(key));
      }
    }
  });
}

// Ejecutar inspección inicial
inspectCurrentState();

// Exponer funciones globalmente
window.cleanLoveMeSkyCache = cleanLoveMeSkyCache;
window.inspectLoveMeSkyCurrent = inspectCurrentState;

console.log(`
🎯 INSTRUCCIONES:
1. Ejecuta inspectCurrentState() para ver el estado actual
2. Si ves banners fantasma, ejecuta cleanLoveMeSkyCache()
3. Recarga la página después de la limpieza

💡 Funciones disponibles:
- inspectCurrentState() - Ver estado actual
- cleanLoveMeSkyCache() - Limpiar cache completamente
`);
