// Utilidad de diagnóstico específica para problemas de navegadores móviles
import { logger } from './logger';

interface BrowserDiagnostic {
  browserName: string;
  browserVersion: string;
  isMobile: boolean;
  isOpera: boolean;
  isBrave: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  isSafari: boolean;
  operatingSystem: string;
  storageSupport: {
    localStorage: boolean;
    sessionStorage: boolean;
    indexedDB: boolean;
    cookies: boolean;
  };
  pwaSupport: {
    serviceWorkerSupported: boolean;
    manifestSupported: boolean;
    installPromptSupported: boolean;
    notificationSupported: boolean;
    pushSupported: boolean;
  };
  operaSpecificIssues: {
    operaMiniMode: boolean;
    dataCompressionEnabled: boolean;
    adBlockerActive: boolean;
    privateMode: boolean;
  };
}

export class BrowserDiagnosticTool {
  private static instance: BrowserDiagnosticTool;
  
  static getInstance(): BrowserDiagnosticTool {
    if (!BrowserDiagnosticTool.instance) {
      BrowserDiagnosticTool.instance = new BrowserDiagnosticTool();
    }
    return BrowserDiagnosticTool.instance;
  }
  
  // Helper functions para reducir complejidad cognitiva
  private detectOpera(userAgent: string): { name: string; version: string } | null {
    if (userAgent.includes('OPR/') || userAgent.includes('Opera/')) {
      const operaRegex = /(OPR\/|Opera\/)([0-9.]+)/;
      const operaMatch = operaRegex.exec(userAgent);
      return {
        name: 'Opera',
        version: operaMatch ? operaMatch[2] : 'Unknown'
      };
    }
    
    if (userAgent.includes('Opera Mini')) {
      return { name: 'Opera Mini', version: 'Mini' };
    }
    
    return null;
  }
  
  private detectChrome(userAgent: string): { name: string; version: string } | null {
    if (userAgent.includes('Chrome/') && !userAgent.includes('Edg/')) {
      const chromeRegex = /Chrome\/([0-9.]+)/;
      const chromeMatch = chromeRegex.exec(userAgent);
      return {
        name: 'Chrome',
        version: chromeMatch ? chromeMatch[1] : 'Unknown'
      };
    }
    return null;
  }
  
  private detectFirefox(userAgent: string): { name: string; version: string } | null {
    if (userAgent.includes('Firefox/')) {
      const firefoxRegex = /Firefox\/([0-9.]+)/;
      const firefoxMatch = firefoxRegex.exec(userAgent);
      return {
        name: 'Firefox',
        version: firefoxMatch ? firefoxMatch[1] : 'Unknown'
      };
    }
    return null;
  }
  
  private detectSafari(userAgent: string): { name: string; version: string } | null {
    if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) {
      const safariRegex = /Version\/([0-9.]+)/;
      const safariMatch = safariRegex.exec(userAgent);
      return {
        name: 'Safari',
        version: safariMatch ? safariMatch[1] : 'Unknown'
      };
    }
    return null;
  }
  
  private detectBrave(): { name: string; version: string } | null {
    if ((navigator as any).brave && typeof (navigator as any).brave.isBrave === 'function') {
      return { name: 'Brave', version: 'Unknown' };
    }
    return null;
  }
  
  // Detectar navegador específico con más precisión
  private detectBrowser(): { name: string; version: string } {
    if (typeof window === 'undefined') {
      return { name: 'Unknown', version: 'Unknown' };
    }
    
    const userAgent = navigator.userAgent;
    
    // Intentar detectar cada navegador usando funciones helper
    const detectors = [
      () => this.detectOpera(userAgent),
      () => this.detectBrave(),
      () => this.detectChrome(userAgent),
      () => this.detectFirefox(userAgent),
      () => this.detectSafari(userAgent)
    ];
    
    for (const detector of detectors) {
      const result = detector();
      if (result) return result;
    }
    
    return { name: 'Unknown', version: 'Unknown' };
  }
  
  // Detectar sistema operativo
  private detectOS(): string {
    if (typeof window === 'undefined') return 'Unknown';
    
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    
    return 'Unknown';
  }
  
  // Probar soporte de almacenamiento
  private testStorageSupport() {
    const support = {
      localStorage: false,
      sessionStorage: false,
      indexedDB: false,
      cookies: false
    };
    
    // Probar localStorage
    try {
      const testKey = 'lealta_storage_test';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      support.localStorage = true;
    } catch (error) {
      logger.warn('❌ localStorage no disponible:', error);
    }
    
    // Probar sessionStorage
    try {
      const testKey = 'lealta_session_test';
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
      support.sessionStorage = true;
    } catch (error) {
      logger.warn('❌ sessionStorage no disponible:', error);
    }
    
    // Probar IndexedDB
    try {
      support.indexedDB = 'indexedDB' in window;
    } catch (error) {
      logger.warn('❌ IndexedDB no disponible:', error);
    }
    
    // Probar cookies
    try {
      document.cookie = 'lealta_cookie_test=test; path=/';
      support.cookies = document.cookie.includes('lealta_cookie_test');
      // Limpiar cookie de prueba
      document.cookie = 'lealta_cookie_test=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    } catch (error) {
      logger.warn('❌ Cookies no disponibles:', error);
    }
    
    return support;
  }
  
  // Probar soporte PWA
  private testPWASupport() {
    const support = {
      serviceWorkerSupported: false,
      manifestSupported: false,
      installPromptSupported: false,
      notificationSupported: false,
      pushSupported: false
    };
    
    if (typeof window === 'undefined') return support;
    
    // Service Worker
    support.serviceWorkerSupported = 'serviceWorker' in navigator;
    
    // Web App Manifest
    support.manifestSupported = 'onappinstalled' in window;
    
    // Install Prompt (BeforeInstallPrompt)
    support.installPromptSupported = 'onbeforeinstallprompt' in window;
    
    // Notifications
    support.notificationSupported = 'Notification' in window;
    
    // Push Messaging
    support.pushSupported = 'PushManager' in window;
    
    return support;
  }
  
  // Detectar problemas específicos de Opera
  private detectOperaIssues() {
    const issues = {
      operaMiniMode: false,
      dataCompressionEnabled: false,
      adBlockerActive: false,
      privateMode: false
    };
    
    if (typeof window === 'undefined') return issues;
    
    const userAgent = navigator.userAgent;
    
    // Opera Mini mode
    issues.operaMiniMode = userAgent.includes('Opera Mini');
    
    // Data compression (Opera Turbo/Compression)
    issues.dataCompressionEnabled = userAgent.includes('Opera Turbo') || 
                                   userAgent.includes('Compression');
    
    // Private mode detection (aproximado)
    try {
      localStorage.setItem('lealta_private_test', 'test');
      localStorage.removeItem('lealta_private_test');
      issues.privateMode = false;
    } catch (error) {
      // Si localStorage falla completamente, podría ser modo privado
      console.warn('Private mode detected or localStorage unavailable:', error);
      issues.privateMode = true;
    }
    
    // Ad blocker detection (básico)
    try {
      const testAd = document.createElement('div');
      testAd.innerHTML = '&nbsp;';
      testAd.className = 'adsbox';
      testAd.style.position = 'absolute';
      testAd.style.left = '-1000px';
      document.body.appendChild(testAd);
      
      setTimeout(() => {
        const adBlocked = testAd.offsetHeight === 0;
        issues.adBlockerActive = adBlocked;
        document.body.removeChild(testAd);
      }, 100);
    } catch {
      // Si falla, asumimos que no hay ad blocker
      issues.adBlockerActive = false;
    }
    
    return issues;
  }
  
  // Helper para crear el objeto diagnostic base
  private createBaseDiagnostic(browser: { name: string; version: string }): Partial<BrowserDiagnostic> {
    return {
      browserName: browser.name,
      browserVersion: browser.version,
      isMobile: this.isMobileDevice(),
      isOpera: browser.name.includes('Opera'),
      isBrave: browser.name === 'Brave',
      isChrome: browser.name === 'Chrome',
      isFirefox: browser.name === 'Firefox',
      isSafari: browser.name === 'Safari',
    };
  }

  // Ejecutar diagnóstico completo
  public async runFullDiagnostic(): Promise<BrowserDiagnostic> {
    logger.log('🔍 Iniciando diagnóstico completo del navegador...');
    
    const browser = this.detectBrowser();
    const os = this.detectOS();
    const storageSupport = this.testStorageSupport();
    const pwaSupport = this.testPWASupport();
    const operaIssues = this.detectOperaIssues();
    
    const baseDiagnostic = this.createBaseDiagnostic(browser);
    
    const diagnostic: BrowserDiagnostic = {
      ...baseDiagnostic,
      operatingSystem: os,
      storageSupport,
      pwaSupport,
      operaSpecificIssues: operaIssues
    } as BrowserDiagnostic;
    
    return diagnostic;
  }
  
  // Detectar dispositivo móvil
  private isMobileDevice(): boolean {
    if (typeof window === 'undefined') return false;
    
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0);
  }
  
  // Helper para generar reporte de información básica
  private generateBasicInfo(diagnostic: BrowserDiagnostic): string {
    let report = '🔍 DIAGNÓSTICO DE NAVEGADOR LEALTA 2.0\n';
    report += '================================================\n\n';
    
    report += `🌐 Navegador: ${diagnostic.browserName} ${diagnostic.browserVersion}\n`;
    report += `📱 Móvil: ${diagnostic.isMobile ? 'Sí' : 'No'}\n`;
    report += `💻 Sistema Operativo: ${diagnostic.operatingSystem}\n\n`;
    
    return report;
  }
  
  // Helper para generar reporte de problemas de Opera
  private generateOperaIssues(diagnostic: BrowserDiagnostic): string {
    if (!diagnostic.isOpera) return '';
    
    let report = '🔴 PROBLEMAS DETECTADOS EN OPERA:\n';
    
    if (diagnostic.operaSpecificIssues.operaMiniMode) {
      report += '⚠️ OPERA MINI DETECTADO\n';
      report += '   • Opera Mini usa compresión extrema del servidor\n';
      report += '   • JavaScript limitado, Storage puede fallar\n';
      report += '   • PWA no compatible en Opera Mini\n';
      report += '   • SOLUCIÓN: Usar Opera normal, no Mini\n\n';
    }
    
    if (!diagnostic.storageSupport.localStorage) {
      report += '⚠️ LOCAL STORAGE NO DISPONIBLE\n';
      report += '   • Opera puede bloquear localStorage en modo privado\n';
      report += '   • Compresión de datos puede interferir\n';
      report += '   • SOLUCIÓN: Desactivar modo privado y compresión\n\n';
    }
    
    if (!diagnostic.pwaSupport.installPromptSupported) {
      report += '⚠️ PWA INSTALL PROMPT NO COMPATIBLE\n';
      report += '   • Opera en móvil tiene soporte PWA limitado\n';
      report += '   • SOLUCIÓN: Agregar manualmente desde menú Opera\n\n';
    }
    
    return report;
  }
  
  // Helper para generar reporte de soporte
  private generateSupportInfo(diagnostic: BrowserDiagnostic): string {
    let report = '💾 SOPORTE DE ALMACENAMIENTO:\n';
    report += `   localStorage: ${diagnostic.storageSupport.localStorage ? '✅' : '❌'}\n`;
    report += `   sessionStorage: ${diagnostic.storageSupport.sessionStorage ? '✅' : '❌'}\n`;
    report += `   IndexedDB: ${diagnostic.storageSupport.indexedDB ? '✅' : '❌'}\n`;
    report += `   Cookies: ${diagnostic.storageSupport.cookies ? '✅' : '❌'}\n\n`;
    
    report += '📱 SOPORTE PWA:\n';
    report += `   Service Worker: ${diagnostic.pwaSupport.serviceWorkerSupported ? '✅' : '❌'}\n`;
    report += `   Manifest: ${diagnostic.pwaSupport.manifestSupported ? '✅' : '❌'}\n`;
    report += `   Install Prompt: ${diagnostic.pwaSupport.installPromptSupported ? '✅' : '❌'}\n`;
    report += `   Notificaciones: ${diagnostic.pwaSupport.notificationSupported ? '✅' : '❌'}\n`;
    report += `   Push Messages: ${diagnostic.pwaSupport.pushSupported ? '✅' : '❌'}\n\n`;
    
    return report;
  }
  
  // Helper para generar recomendaciones
  private generateRecommendations(diagnostic: BrowserDiagnostic): string {
    let report = '💡 RECOMENDACIONES:\n';
    
    if (diagnostic.isOpera && diagnostic.isMobile) {
      report += '1. 🔄 CAMBIAR NAVEGADOR EN MÓVIL:\n';
      report += '   • Chrome para Android (mejor soporte PWA)\n';
      report += '   • Firefox Mobile (buen soporte alternativo)\n';
      report += '   • Samsung Internet (si es Samsung)\n\n';
      
      if (diagnostic.operaSpecificIssues.operaMiniMode) {
        report += '2. ⚡ SI QUIERES SEGUIR CON OPERA:\n';
        report += '   • Desinstalar Opera Mini\n';
        report += '   • Instalar Opera normal (no Mini)\n';
        report += '   • Desactivar compresión de datos en configuración\n\n';
      }
    }
    
    if (!diagnostic.storageSupport.localStorage) {
      report += '3. 🔒 PROBLEMAS DE ALMACENAMIENTO:\n';
      report += '   • Salir de modo privado/incógnito\n';
      report += '   • Permitir cookies y almacenamiento local\n';
      report += '   • Limpiar caché del navegador\n\n';
    }
    
    report += '4. 🎯 CONFIGURACIÓN ÓPTIMA:\n';
    report += '   • Navegador: Chrome/Brave/Firefox (no Opera Mini)\n';
    report += '   • Permisos: Activar notificaciones y almacenamiento\n';
    report += '   • PWA: Instalar desde "Agregar a inicio" en Chrome\n';
    
    return report;
  }

  // Generar reporte detallado con soluciones
  public generateReport(diagnostic: BrowserDiagnostic): string {
    const basicInfo = this.generateBasicInfo(diagnostic);
    const operaIssues = this.generateOperaIssues(diagnostic);
    const supportInfo = this.generateSupportInfo(diagnostic);
    const recommendations = this.generateRecommendations(diagnostic);
    
    return basicInfo + operaIssues + supportInfo + recommendations;
  }
}

// Función de conveniencia para diagnóstico rápido
export async function runBrowserDiagnostic(): Promise<void> {
  const diagnostic = BrowserDiagnosticTool.getInstance();
  const result = await diagnostic.runFullDiagnostic();
  const report = diagnostic.generateReport(result);
  
  logger.log(report);
  
  // También mostrar en consola para debugging
  console.log(report);
}

// Exportar instancia singleton
export const browserDiagnostic = BrowserDiagnosticTool.getInstance();
