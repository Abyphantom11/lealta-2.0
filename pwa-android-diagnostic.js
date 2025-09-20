// PWA Android Analysis & Diagnostic Tool
// Este script analiza todos los aspectos que afectan la instalabilidad PWA en Android

console.log('🔧 === PWA ANDROID DIAGNOSTIC TOOL ===');

// 1. INFORMACIÓN DEL ENTORNO
console.log('\n📱 1. INFORMACIÓN DEL ENTORNO');
console.log('User Agent:', navigator.userAgent);
console.log('Plataforma:', navigator.platform);
console.log('Display Mode:', window.matchMedia('(display-mode: standalone)').matches ? 'Standalone' : 'Browser');
console.log('URL actual:', window.location.href);
console.log('Protocolo:', window.location.protocol);
console.log('Hostname:', window.location.hostname);

// 2. VERIFICACIÓN DE MANIFEST
console.log('\n📄 2. VERIFICACIÓN DE MANIFEST');
async function checkManifest() {
  try {
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (!manifestLink) {
      console.error('❌ No se encontró link rel="manifest"');
      return false;
    }
    
    console.log('✅ Link manifest encontrado:', manifestLink.href);
    
    const response = await fetch(manifestLink.href);
    if (!response.ok) {
      console.error('❌ Manifest no accesible:', response.status);
      return false;
    }
    
    const manifest = await response.json();
    console.log('📄 Manifest content:', manifest);
    
    // Verificar campos críticos
    const criticalFields = [
      'name', 'short_name', 'start_url', 'display', 
      'icons', 'theme_color', 'background_color'
    ];
    
    console.log('\n🔍 Verificando campos críticos:');
    criticalFields.forEach(field => {
      const exists = field in manifest;
      console.log(`${exists ? '✅' : '❌'} ${field}:`, exists ? manifest[field] : 'MISSING');
    });
    
    // Verificar iconos específicamente
    if (manifest.icons && Array.isArray(manifest.icons)) {
      console.log('\n🖼️ Análisis de iconos:');
      manifest.icons.forEach((icon, index) => {
        console.log(`Icon ${index + 1}:`, {
          src: icon.src,
          sizes: icon.sizes,
          type: icon.type || 'image/png'
        });
      });
      
      // Verificar iconos requeridos para Android
      const requiredSizes = ['192x192', '512x512'];
      const hasRequiredSizes = requiredSizes.every(size => 
        manifest.icons.some(icon => icon.sizes && icon.sizes.includes(size))
      );
      
      console.log(`${hasRequiredSizes ? '✅' : '❌'} Iconos requeridos (192x192, 512x512):`, hasRequiredSizes);
    } else {
      console.error('❌ No se encontraron iconos en el manifest');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error verificando manifest:', error);
    return false;
  }
}

// 3. VERIFICACIÓN DE SERVICE WORKER
console.log('\n⚙️ 3. VERIFICACIÓN DE SERVICE WORKER');
async function checkServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.error('❌ Service Worker no soportado');
    return false;
  }
  
  console.log('✅ Service Worker soportado');
  
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      console.log('✅ Service Worker registrado');
      console.log('Scope:', registration.scope);
      console.log('State:', registration.active ? 'Active' : 'Not Active');
      console.log('Installing:', !!registration.installing);
      console.log('Waiting:', !!registration.waiting);
      
      // Intentar actualizar
      await registration.update();
      console.log('✅ Service Worker actualizado');
      
      return true;
    } else {
      console.log('⚠️ Service Worker no registrado, registrando...');
      const newRegistration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registrado exitosamente:', newRegistration.scope);
      return true;
    }
  } catch (error) {
    console.error('❌ Error con Service Worker:', error);
    return false;
  }
}

// 4. VERIFICACIÓN DE BEFOREINSTALLPROMPT
console.log('\n📲 4. VERIFICACIÓN DE BEFOREINSTALLPROMPT');
let hasBeforeInstallPrompt = false;
let deferredPrompt = null;

// Listener para capturar el evento
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('🎉 beforeinstallprompt EVENT CAPTURED!');
  hasBeforeInstallPrompt = true;
  deferredPrompt = e;
  e.preventDefault();
});

// Verificar si ya está disponible
setTimeout(() => {
  console.log(`${hasBeforeInstallPrompt ? '✅' : '❌'} beforeinstallprompt disponible:`, hasBeforeInstallPrompt);
  
  if (deferredPrompt) {
    console.log('✅ Prompt de instalación capturado y disponible');
  } else {
    console.log('❌ No se capturó prompt de instalación');
    
    // Diagnosticar por qué no está disponible
    console.log('\n🔍 DIAGNÓSTICO - ¿Por qué no está disponible?');
    
    // Verificar si ya está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('🔸 La app ya está instalada (modo standalone)');
    }
    
    // Verificar navegador
    const isChrome = /Chrome/.test(navigator.userAgent) && !/Edg/.test(navigator.userAgent);
    const isEdge = /Edg/.test(navigator.userAgent);
    const isFirefox = /Firefox/.test(navigator.userAgent);
    const isSamsung = /SamsungBrowser/.test(navigator.userAgent);
    
    console.log('🔸 Navegador Chrome:', isChrome);
    console.log('🔸 Navegador Edge:', isEdge);
    console.log('🔸 Navegador Firefox:', isFirefox);
    console.log('🔸 Navegador Samsung:', isSamsung);
    
    // Verificar Android
    const isAndroid = /Android/.test(navigator.userAgent);
    console.log('🔸 Dispositivo Android:', isAndroid);
    
    // Verificar engagement criteria
    console.log('🔸 Posibles causas:');
    console.log('   - La app ya fue instalada anteriormente');
    console.log('   - No cumple criterios de engagement (tiempo en sitio)');
    console.log('   - Manifest o Service Worker tienen problemas');
    console.log('   - El navegador no soporta beforeinstallprompt');
    console.log('   - El dominio no cumple requisitos HTTPS');
  }
}, 2000);

// 5. VERIFICACIÓN DE CRITERIOS PWA
console.log('\n✅ 5. VERIFICACIÓN DE CRITERIOS PWA');
function checkPWACriteria() {
  const criteria = {
    https: window.location.protocol === 'https:' || window.location.hostname === 'localhost',
    manifest: !!document.querySelector('link[rel="manifest"]'),
    serviceWorker: 'serviceWorker' in navigator,
    responsive: window.innerWidth > 0 && window.innerHeight > 0,
    standalone: window.matchMedia('(display-mode: standalone)').matches
  };
  
  console.log('HTTPS/Localhost:', criteria.https ? '✅' : '❌');
  console.log('Manifest Link:', criteria.manifest ? '✅' : '❌');
  console.log('Service Worker Support:', criteria.serviceWorker ? '✅' : '❌');
  console.log('Responsive Design:', criteria.responsive ? '✅' : '❌');
  console.log('Ya instalado:', criteria.standalone ? '✅' : '❌');
  
  const canBeInstallable = criteria.https && criteria.manifest && criteria.serviceWorker && !criteria.standalone;
  console.log('\n🎯 PUEDE SER INSTALABLE:', canBeInstallable ? '✅ SÍ' : '❌ NO');
  
  return criteria;
}

// 6. PRUEBAS DE CONEXIÓN E ICONOS
console.log('\n🖼️ 6. VERIFICACIÓN DE ICONOS');
async function testIcons() {
  try {
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (!manifestLink) return;
    
    const manifest = await fetch(manifestLink.href).then(r => r.json());
    if (!manifest.icons) return;
    
    console.log('Probando accesibilidad de iconos...');
    
    for (const icon of manifest.icons) {
      try {
        const response = await fetch(icon.src);
        console.log(`${response.ok ? '✅' : '❌'} ${icon.src} (${icon.sizes || 'no size'}) - ${response.status}`);
      } catch (error) {
        console.log(`❌ ${icon.src} - Error: ${error.message}`);
      }
    }
  } catch (error) {
    console.error('Error testing icons:', error);
  }
}

// 7. SIMULACIÓN DE INSTALACIÓN
console.log('\n🚀 7. FUNCIÓN DE INSTALACIÓN');
window.testPWAInstall = async function() {
  console.log('🔧 Intentando instalación PWA...');
  
  if (deferredPrompt) {
    try {
      const result = await deferredPrompt.prompt();
      console.log('✅ Prompt mostrado');
      
      const choiceResult = await deferredPrompt.userChoice;
      console.log('Resultado:', choiceResult.outcome);
      
      if (choiceResult.outcome === 'accepted') {
        console.log('🎉 ¡Usuario aceptó la instalación!');
      } else {
        console.log('😔 Usuario rechazó la instalación');
      }
      
      deferredPrompt = null;
    } catch (error) {
      console.error('❌ Error en instalación:', error);
    }
  } else {
    console.log('❌ No hay prompt de instalación disponible');
    console.log('💡 Esto puede significar:');
    console.log('   1. La app ya está instalada');
    console.log('   2. No cumple criterios PWA');
    console.log('   3. El navegador no soporta instalación');
    console.log('   4. Necesita más engagement del usuario');
  }
};

// 8. INFORMACIÓN ADICIONAL PARA DEBUGGING
console.log('\n🔧 8. INFORMACIÓN ADICIONAL');
function additionalInfo() {
  console.log('Window size:', `${window.innerWidth}x${window.innerHeight}`);
  console.log('Screen size:', `${screen.width}x${screen.height}`);
  console.log('Device pixel ratio:', window.devicePixelRatio);
  console.log('Online:', navigator.onLine);
  console.log('Connection:', navigator.connection ? navigator.connection.effectiveType : 'No disponible');
  console.log('Touch support:', 'ontouchstart' in window);
  console.log('Vibration support:', 'vibrate' in navigator);
  console.log('Web Share API:', 'share' in navigator);
  console.log('Notification support:', 'Notification' in window);
  console.log('Push messaging:', 'PushManager' in window);
  
  // Verificar almacenamiento
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    navigator.storage.estimate().then(estimate => {
      console.log('Storage quota:', estimate.quota);
      console.log('Storage usage:', estimate.usage);
    });
  }
}

// EJECUTAR TODAS LAS VERIFICACIONES
async function runFullDiagnostic() {
  console.log('\n🔄 EJECUTANDO DIAGNÓSTICO COMPLETO...\n');
  
  const manifestOk = await checkManifest();
  const swOk = await checkServiceWorker();
  const criteria = checkPWACriteria();
  await testIcons();
  additionalInfo();
  
  console.log('\n📊 === RESUMEN DEL DIAGNÓSTICO ===');
  console.log(`Manifest: ${manifestOk ? '✅' : '❌'}`);
  console.log(`Service Worker: ${swOk ? '✅' : '❌'}`);
  console.log(`Criterios PWA: ${criteria.https && criteria.manifest && criteria.serviceWorker ? '✅' : '❌'}`);
  console.log(`beforeinstallprompt: ${hasBeforeInstallPrompt ? '✅' : '❌'} (verificar en 2 segundos)`);
  
  console.log('\n💡 RECOMENDACIONES:');
  if (!manifestOk) console.log('🔸 Revisar y corregir manifest.json');
  if (!swOk) console.log('🔸 Revisar Service Worker');
  if (!criteria.https) console.log('🔸 Usar HTTPS o localhost');
  if (!hasBeforeInstallPrompt) {
    console.log('🔸 Para activar beforeinstallprompt en Android Chrome:');
    console.log('   - Usar durante al menos 30 segundos');
    console.log('   - Navegar por diferentes páginas');
    console.log('   - Esperar al menos 5 minutos entre intentos');
    console.log('   - Borrar datos del sitio y volver a intentar');
    console.log('   - Verificar que no esté ya instalado');
  }
  
  console.log('\n🚀 Para probar instalación manual, ejecuta: testPWAInstall()');
}

// Ejecutar diagnóstico automáticamente
runFullDiagnostic();

// Exportar funciones para uso manual
window.pwaDiagnostic = {
  checkManifest,
  checkServiceWorker,
  checkPWACriteria,
  testIcons,
  runFullDiagnostic,
  testPWAInstall: window.testPWAInstall
};
