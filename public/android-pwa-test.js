// Script de verificación PWA específico para Android Chrome
// Ejecutar en DevTools del móvil: copy(JSON.stringify(window.androidPWATest(), null, 2))

window.androidPWATest = function() {
  const results = {
    timestamp: new Date().toISOString(),
    device: {
      userAgent: navigator.userAgent,
      isAndroid: /Android/.test(navigator.userAgent),
      isChrome: /Chrome/.test(navigator.userAgent) && !/Edg/.test(navigator.userAgent),
      isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      standalone: window.matchMedia('(display-mode: standalone)').matches,
      screenSize: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`
    },
    pwa: {
      isHTTPS: window.location.protocol === 'https:' || window.location.hostname === 'localhost',
      hasManifest: !!document.querySelector('link[rel="manifest"]'),
      manifestUrl: document.querySelector('link[rel="manifest"]')?.href || null,
      hasServiceWorker: 'serviceWorker' in navigator,
      beforeInstallPromptSupported: 'onbeforeinstallprompt' in window,
      hasBeforeInstallPrompt: !!window.deferredPrompt || !!localStorage.getItem('pwa-install-prompt'),
      canInstall: false,
      isInstalled: window.matchMedia('(display-mode: standalone)').matches
    },
    manifest: null,
    serviceWorker: null,
    recommendations: []
  };

  // Verificar manifest
  const manifestLink = document.querySelector('link[rel="manifest"]');
  if (manifestLink) {
    fetch(manifestLink.href)
      .then(response => response.json())
      .then(manifest => {
        results.manifest = {
          name: manifest.name,
          shortName: manifest.short_name,
          startUrl: manifest.start_url,
          display: manifest.display,
          orientation: manifest.orientation,
          themeColor: manifest.theme_color,
          backgroundColor: manifest.background_color,
          iconsCount: manifest.icons?.length || 0,
          icons: manifest.icons?.map(icon => ({
            src: icon.src,
            sizes: icon.sizes,
            type: icon.type,
            purpose: icon.purpose
          })) || [],
          shortcuts: manifest.shortcuts?.length || 0
        };
        
        // Verificar iconos PNG
        const hasPngIcons = manifest.icons?.some(icon => icon.type === 'image/png');
        const hasMaskableIcons = manifest.icons?.some(icon => icon.purpose?.includes('maskable'));
        
        if (!hasPngIcons) {
          results.recommendations.push('❌ CRÍTICO: Usar iconos PNG en lugar de SVG para Android');
        }
        if (!hasMaskableIcons) {
          results.recommendations.push('⚠️ Agregar iconos maskable para mejor integración Android');
        }
      })
      .catch(error => {
        results.manifest = { error: error.message };
        results.recommendations.push('❌ CRÍTICO: Manifest no accesible');
      });
  } else {
    results.recommendations.push('❌ CRÍTICO: No se encontró link rel="manifest"');
  }

  // Verificar Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration()
      .then(registration => {
        if (registration) {
          results.serviceWorker = {
            scope: registration.scope,
            state: registration.active ? 'active' : 'inactive',
            installing: !!registration.installing,
            waiting: !!registration.waiting,
            updateViaCache: registration.updateViaCache
          };
        } else {
          results.serviceWorker = { status: 'not-registered' };
          results.recommendations.push('⚠️ Service Worker no registrado');
        }
      })
      .catch(error => {
        results.serviceWorker = { error: error.message };
        results.recommendations.push('❌ Error con Service Worker');
      });
  } else {
    results.recommendations.push('❌ CRÍTICO: Service Worker no soportado');
  }

  // Verificar criterios PWA para Android
  if (!results.device.isAndroid) {
    results.recommendations.push('ℹ️ Prueba específica para Android - dispositivo actual no es Android');
  }
  
  if (!results.device.isChrome) {
    results.recommendations.push('⚠️ Prueba optimizada para Chrome Android');
  }

  if (!results.pwa.isHTTPS) {
    results.recommendations.push('❌ CRÍTICO: Requiere HTTPS para PWA');
  }

  if (results.device.standalone) {
    results.recommendations.push('✅ PWA ya instalado - ejecutándose en modo standalone');
  }

  // Verificar si beforeinstallprompt puede activarse
  if (results.device.isAndroid && results.device.isChrome && !results.device.standalone) {
    if (!results.pwa.beforeInstallPromptSupported) {
      results.recommendations.push('❌ beforeinstallprompt no soportado');
    } else {
      results.recommendations.push('ℹ️ Para activar beforeinstallprompt: navegar 30s+, interactuar con el sitio');
    }
  }

  // Instrucciones específicas para Android
  if (results.device.isAndroid && !results.device.standalone) {
    results.recommendations.push('📱 Android Chrome: Esperar 30 segundos, navegar por el sitio, luego verificar menú "Agregar a pantalla de inicio"');
  }

  console.log('🔧 === RESULTADO PWA ANDROID TEST ===');
  console.log('📱 Dispositivo:', results.device.isAndroid ? 'Android ✅' : 'No Android ❌');
  console.log('🌐 Chrome:', results.device.isChrome ? 'Sí ✅' : 'No ❌');
  console.log('🔒 HTTPS:', results.pwa.isHTTPS ? 'Sí ✅' : 'No ❌');
  console.log('📄 Manifest:', results.pwa.hasManifest ? 'Sí ✅' : 'No ❌');
  console.log('⚙️ Service Worker:', results.pwa.hasServiceWorker ? 'Sí ✅' : 'No ❌');
  console.log('📱 Instalado:', results.pwa.isInstalled ? 'Sí ✅' : 'No ❌');
  
  if (results.recommendations.length > 0) {
    console.log('\n💡 RECOMENDACIONES:');
    results.recommendations.forEach(rec => console.log(rec));
  }
  
  return results;
};

// Auto-ejecutar si estamos en Android
if (/Android/.test(navigator.userAgent)) {
  console.log('🤖 Android detectado - ejecutando test PWA automático en 3 segundos...');
  setTimeout(() => {
    window.androidPWATest();
  }, 3000);
}

console.log('📱 Test PWA Android cargado. Ejecutar: androidPWATest()');
