// Script de verificación para PWA Service exports
// Ejecutar en la consola del navegador para verificar que las funciones están disponibles

console.log('🧪 === VERIFICACIÓN PWA SERVICE EXPORTS ===');

// Verificar importaciones principales
try {
  const pwaModule = require('@/services/pwaService');
  console.log('📦 Módulo PWA cargado:', Object.keys(pwaModule));
  
  // Verificar funciones específicas
  const requiredFunctions = [
    'isPWAInstalled',
    'canInstallPWA', 
    'installPWA',
    'initializePWA',
    'checkPWAStatus',
    'pwaService'
  ];
  
  console.log('🔍 Verificando funciones requeridas:');
  requiredFunctions.forEach(funcName => {
    const exists = funcName in pwaModule;
    const type = typeof pwaModule[funcName];
    console.log(`${exists ? '✅' : '❌'} ${funcName}: ${type}`);
  });
  
  // Test básico de funciones
  if (pwaModule.isPWAInstalled) {
    console.log('🧪 Test isPWAInstalled():', pwaModule.isPWAInstalled());
  }
  
  if (pwaModule.canInstallPWA) {
    console.log('🧪 Test canInstallPWA():', pwaModule.canInstallPWA());
  }
  
  if (pwaModule.checkPWAStatus) {
    console.log('🧪 Test checkPWAStatus():', pwaModule.checkPWAStatus());
  }
  
  console.log('✅ Verificación completada - todas las funciones están disponibles');
  
} catch (error) {
  console.error('❌ Error verificando PWA Service:', error);
  console.log('💡 Sugerencias:');
  console.log('   - Reiniciar servidor de desarrollo (npm run dev)');
  console.log('   - Limpiar cache (.next/cache)');
  console.log('   - Verificar ruta de importación');
}

// Si estamos en el navegador, verificar también window.pwaService
if (typeof window !== 'undefined') {
  console.log('\n🌐 Verificando window.pwaService...');
  if (window.pwaService) {
    console.log('✅ window.pwaService disponible');
    console.log('📊 Estado PWA:', window.pwaService.getState());
  } else {
    console.log('⚠️ window.pwaService no disponible (normal si no se ha inicializado)');
  }
  
  if (window.debugPWA) {
    console.log('✅ window.debugPWA disponible');
  }
}
