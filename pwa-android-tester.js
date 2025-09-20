// Script de testing PWA Android - Lealta
// Verifica que todos los componentes funcionen correctamente

console.log('🧪 === PWA ANDROID TEST SUITE - LEALTA ===');

class PWAAndroidTester {
  private results: any[] = [];
  
  async runAllTests(): Promise<void> {
    console.log('🚀 Iniciando test completo PWA Android...\n');
    
    await this.testManifest();
    await this.testIcons();
    await this.testServiceWorker();
    await this.testInstallability();
    await this.testAndroidSpecific();
    
    this.printSummary();
  }
  
  private async testManifest(): Promise<void> {
    console.log('📄 === TEST 1: MANIFEST ===');
    
    try {
      const manifestLink = document.querySelector('link[rel="manifest"]');
      this.assert('Manifest link existe', !!manifestLink);
      
      if (!manifestLink) return;
      
      const manifestUrl = (manifestLink as HTMLLinkElement).href;
      const response = await fetch(manifestUrl);
      this.assert('Manifest es accesible', response.ok);
      
      const manifest = await response.json();
      
      // Verificar campos críticos
      this.assert('Tiene name', !!manifest.name);
      this.assert('Tiene short_name', !!manifest.short_name);
      this.assert('Tiene start_url', !!manifest.start_url);
      this.assert('Display es standalone', manifest.display === 'standalone');
      this.assert('Tiene icons array', Array.isArray(manifest.icons));
      this.assert('Tiene theme_color', !!manifest.theme_color);
      this.assert('Tiene background_color', !!manifest.background_color);
      
      // Verificar iconos específicos
      if (manifest.icons) {
        const has192 = manifest.icons.some((icon: any) => 
          icon.sizes && icon.sizes.includes('192x192')
        );
        const has512 = manifest.icons.some((icon: any) => 
          icon.sizes && icon.sizes.includes('512x512')
        );
        const hasMaskable = manifest.icons.some((icon: any) => 
          icon.purpose && icon.purpose.includes('maskable')
        );
        
        this.assert('Tiene icono 192x192', has192);
        this.assert('Tiene icono 512x512', has512);
        this.assert('Tiene iconos maskable', hasMaskable);
      }
      
      console.log('📱 Manifest info:', {
        name: manifest.name,
        iconCount: manifest.icons?.length || 0,
        theme: manifest.theme_color
      });
      
    } catch (error) {
      this.assert('Manifest accesible', false, error);
    }
    
    console.log('');
  }
  
  private async testIcons(): Promise<void> {
    console.log('🖼️ === TEST 2: ICONOS OFICIALES LEALTA ===');
    
    const iconsToTest = [
      '/icons/icon-base.svg',
      '/icons/icon-192-new.svg',
      '/icons/icon-512-new.svg'
    ];
    
    for (const iconPath of iconsToTest) {
      try {
        const response = await fetch(iconPath);
        this.assert(`${iconPath} accesible`, response.ok);
        
        if (response.ok) {
          const content = await response.text();
          this.assert(`${iconPath} es SVG válido`, content.includes('<svg'));
          this.assert(`${iconPath} contiene gradientes`, content.includes('Gradient'));
          console.log(`✅ ${iconPath} - ${Math.round(content.length / 1024)}KB`);
        }
      } catch (error) {
        this.assert(`${iconPath} accesible`, false, error);
      }
    }
    
    console.log('');
  }
  
  private async testServiceWorker(): Promise<void> {
    console.log('⚙️ === TEST 3: SERVICE WORKER ===');
    
    try {
      this.assert('Service Worker soportado', 'serviceWorker' in navigator);
      
      if (!('serviceWorker' in navigator)) return;
      
      const registration = await navigator.serviceWorker.getRegistration();
      this.assert('Service Worker registrado', !!registration);
      
      if (registration) {
        this.assert('SW activo', !!registration.active);
        this.assert('Scope correcto', registration.scope.endsWith('/'));
        
        console.log('🔧 SW info:', {
          scope: registration.scope,
          state: registration.active?.state,
          scriptURL: registration.active?.scriptURL
        });
        
        // Test actualización
        try {
          await registration.update();
          console.log('✅ SW actualización exitosa');
        } catch (error) {
          console.warn('⚠️ SW actualización falló:', error);
        }
      }
      
    } catch (error) {
      this.assert('Service Worker funcional', false, error);
    }
    
    console.log('');
  }
  
  private async testInstallability(): Promise<void> {
    console.log('📱 === TEST 4: INSTALABILIDAD ===');
    
    // Criterios básicos
    const isHTTPS = window.location.protocol === 'https:' || 
                   window.location.hostname === 'localhost';
    this.assert('HTTPS o localhost', isHTTPS);
    
    const hasManifest = !!document.querySelector('link[rel="manifest"]');
    this.assert('Manifest link presente', hasManifest);
    
    const hasSW = 'serviceWorker' in navigator;
    this.assert('Service Worker soportado', hasSW);
    
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    this.assert('NO está en modo standalone', !isStandalone);
    
    // Estado PWA Service
    if ((window as any).pwaService) {
      const pwaState = (window as any).pwaService.getState();
      this.assert('PWA Service inicializado', true);
      this.assert('Can install disponible', pwaState.canInstall);
      
      console.log('🎯 PWA State:', {
        canInstall: pwaState.canInstall,
        isInstalled: pwaState.isInstalled,
        hasPrompt: !!pwaState.deferredPrompt,
        attempts: pwaState.installAttempts
      });
    }
    
    console.log('');
  }
  
  private async testAndroidSpecific(): Promise<void> {
    console.log('🤖 === TEST 5: ANDROID ESPECÍFICO ===');
    
    const userAgent = navigator.userAgent;
    const isAndroid = /Android/.test(userAgent);
    const isChrome = /Chrome/.test(userAgent) && !/Edg/.test(userAgent);
    const isSamsung = /SamsungBrowser/.test(userAgent);
    
    console.log('📱 Dispositivo info:', {
      userAgent: userAgent.substring(0, 100) + '...',
      isAndroid,
      isChrome,
      isSamsung,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      pixelRatio: window.devicePixelRatio
    });
    
    this.assert('Es dispositivo Android', isAndroid);
    this.assert('Es Chrome o Samsung Browser', isChrome || isSamsung);
    
    // Test características Android
    this.assert('Soporte touch', 'ontouchstart' in window);
    this.assert('Soporte vibración', 'vibrate' in navigator);
    
    // Test orientación
    if (screen.orientation) {
      console.log('🔄 Orientación:', {
        type: screen.orientation.type,
        angle: screen.orientation.angle
      });
    }
    
    // Test beforeinstallprompt
    setTimeout(() => {
      const hasPrompt = !!(window as any).pwaService?.getState()?.deferredPrompt;
      console.log('⏳ beforeinstallprompt capturado:', hasPrompt);
      
      if (!hasPrompt && isAndroid && isChrome) {
        console.log('💡 Para activar beforeinstallprompt:');
        console.log('   - Navegar por 30+ segundos');
        console.log('   - Interactuar con diferentes páginas');
        console.log('   - Esperar engagement del usuario');
      }
    }, 2000);
    
    console.log('');
  }
  
  private assert(description: string, condition: boolean, error?: any): void {
    const result = {
      description,
      passed: condition,
      error
    };
    
    this.results.push(result);
    
    const icon = condition ? '✅' : '❌';
    console.log(`${icon} ${description}`);
    
    if (!condition && error) {
      console.error('   Error:', error);
    }
  }
  
  private printSummary(): void {
    console.log('\n📊 === RESUMEN DE TESTING ===');
    
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => r.failed).length;
    const total = this.results.length;
    
    console.log(`✅ Pasaron: ${passed}/${total}`);
    console.log(`❌ Fallaron: ${failed}/${total}`);
    console.log(`📈 Success Rate: ${Math.round((passed / total) * 100)}%`);
    
    if (failed > 0) {
      console.log('\n🔧 Problemas encontrados:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => console.log(`   ❌ ${r.description}`));
    }
    
    console.log('\n💡 Recomendaciones:');
    
    if (passed >= total * 0.8) {
      console.log('🎉 ¡PWA está bien configurado para Android!');
      console.log('📱 Para probar instalación:');
      console.log('   - Usar la app por 30+ segundos');
      console.log('   - Navegar entre páginas');
      console.log('   - Ejecutar: pwaService.installPWA()');
    } else {
      console.log('⚠️ PWA necesita ajustes para Android');
      console.log('🔧 Revisar los tests fallidos arriba');
    }
    
    console.log('\n🚀 Tests completados!');
  }
}

// Ejecutar tests automáticamente
const tester = new PWAAndroidTester();

// Exportar para uso manual
(window as any).testPWAAndroid = () => tester.runAllTests();
(window as any).pwaAndroidTester = tester;

// Auto-ejecutar después de 2 segundos
setTimeout(() => {
  console.log('🚀 Ejecutando tests PWA Android automáticamente...\n');
  tester.runAllTests();
}, 2000);

console.log('🧪 Para ejecutar tests manualmente: testPWAAndroid()');
