// PWA Service optimizado para Android usando iconos oficiales de Lealta
// Este service maneja la instalación PWA con los iconos correctos

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallState {
  canInstall: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  deferredPrompt: BeforeInstallPromptEvent | null;
  lastPromptTime: number;
  installAttempts: number;
}

class PWAService {
  private state: PWAInstallState = {
    canInstall: false,
    isInstalled: false,
    isStandalone: false,
    deferredPrompt: null,
    lastPromptTime: 0,
    installAttempts: 0
  };

  private readonly listeners: Array<(state: PWAInstallState) => void> = [];
  private readonly STORAGE_KEY = 'lealta_pwa_state';
  private readonly MIN_PROMPT_INTERVAL = 300000; // 5 minutos entre prompts
  private readonly MAX_INSTALL_ATTEMPTS = 3;

  constructor() {
    this.loadState();
    // Inicializar PWA de forma asíncrona para evitar problemas en constructor
    setTimeout(() => this.initializePWA(), 0);
  }

  /**
   * Inicializa el servicio PWA con detección mejorada para Android
   */
  private async initializePWA(): Promise<void> {
    // Verificar que estamos en el navegador
    if (typeof window === 'undefined') {
      console.log('⚠️ PWA Service: Ejecutándose en servidor, saltando inicialización');
      return;
    }

    try {
      // Detectar si ya está en modo standalone
      this.state.isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      this.state.isInstalled = this.state.isStandalone;

      // Registrar Service Worker si no está registrado
      await this.ensureServiceWorker();

      // Configurar listeners para beforeinstallprompt
      this.setupInstallPromptListener();

      // Detectar cambios en display mode
      this.setupDisplayModeListener();

      // Verificar criterios PWA
      await this.checkPWACriteria();

      console.log('🚀 PWA Service inicializado:', this.state);
      this.notifyListeners();

    } catch (error) {
      console.error('❌ Error inicializando PWA Service:', error);
    }
  }

  /**
   * Asegura que el Service Worker esté registrado
   */
  private async ensureServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️ Service Worker no soportado');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (!registration) {
        console.log('📋 Registrando Service Worker...');
        const newRegistration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        
        console.log('✅ Service Worker registrado:', newRegistration.scope);
        
        // Escuchar actualizaciones
        newRegistration.addEventListener('updatefound', () => {
          console.log('🔄 Actualización de SW disponible');
        });
      } else {
        console.log('✅ Service Worker ya registrado');
        
        // Verificar actualizaciones
        await registration.update();
      }
    } catch (error) {
      console.error('❌ Error con Service Worker:', error);
    }
  }

  /**
   * Configura el listener para beforeinstallprompt
   */
  private setupInstallPromptListener(): void {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      console.log('🎉 beforeinstallprompt capturado!');
      
      const event = e as BeforeInstallPromptEvent;
      event.preventDefault();
      
      this.state.deferredPrompt = event;
      this.state.canInstall = true;
      
      this.saveState();
      this.notifyListeners();
      
      // Notificar que PWA está disponible para instalación
      this.triggerPWANotification();
      
      // Log información del evento para debugging
      console.log('📱 Plataformas soportadas:', event.platforms);
      console.log('🔧 Estado actual PWA:', this.state);
    });

    // Listener para cuando la app es instalada
    window.addEventListener('appinstalled', () => {
      console.log('🎉 ¡PWA instalada exitosamente!');
      
      this.state.isInstalled = true;
      this.state.canInstall = false;
      this.state.deferredPrompt = null;
      
      this.saveState();
      this.notifyListeners();
    });

    // Para Android: recheck periódico más agresivo
    if (/Android/.test(navigator.userAgent)) {
      console.log('📱 Android detectado - configurando estrategia agresiva');
      
      // Recheck cada 15 segundos durante los primeros 3 minutos
      let recheckCount = 0;
      const maxRechecks = 12; // 3 minutos
      
      const recheckInterval = setInterval(() => {
        recheckCount++;
        
        if (recheckCount >= maxRechecks || this.state.canInstall) {
          clearInterval(recheckInterval);
          console.log('🏁 Recheck PWA completado');
          return;
        }
        
        // Disparar eventos que pueden activar beforeinstallprompt en Android
        setTimeout(() => window.dispatchEvent(new Event('scroll')), 100);
        setTimeout(() => window.dispatchEvent(new Event('touchstart', { bubbles: true })), 200);
        setTimeout(() => window.dispatchEvent(new Event('click', { bubbles: true })), 300);
        
        console.log(`🔄 PWA Recheck Android ${recheckCount}/${maxRechecks}`);
      }, 15000);

      // También verificar en eventos de usuario
      const userEvents = ['scroll', 'click', 'touchstart', 'touchend'];
      userEvents.forEach(eventType => {
        document.addEventListener(eventType, () => {
          if (!this.state.canInstall) {
            setTimeout(() => {
              console.log('👤 Evento de usuario - verificando PWA...');
            }, 2000);
          }
        }, { once: true, passive: true });
      });
    }
  }

  /**
   * Detecta cambios en el display mode
   */
  private setupDisplayModeListener(): void {
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    
    mediaQuery.addEventListener('change', (e) => {
      this.state.isStandalone = e.matches;
      this.state.isInstalled = e.matches;
      
      console.log('📱 Display mode cambió:', e.matches ? 'standalone' : 'browser');
      
      this.saveState();
      this.notifyListeners();
    });
  }

  /**
   * Verifica criterios PWA para Android
   */
  private async checkPWACriteria(): Promise<boolean> {
    const criteria = {
      https: window.location.protocol === 'https:' || window.location.hostname === 'localhost',
      manifest: !!document.querySelector('link[rel="manifest"]'),
      serviceWorker: 'serviceWorker' in navigator,
      notInstalled: !this.state.isStandalone
    };

    console.log('🔍 Criterios PWA:', criteria);

    const isEligible = Object.values(criteria).every(Boolean);
    
    if (!isEligible) {
      console.warn('⚠️ No cumple todos los criterios PWA:', criteria);
    }

    return isEligible;
  }

  /**
   * Intenta instalar la PWA
   */
  public async installPWA(): Promise<boolean> {
    if (!this.state.deferredPrompt) {
      console.warn('❌ No hay prompt de instalación disponible');
      this.logInstallationIssues();
      return false;
    }

    // Verificar límites de intentos y tiempo
    const now = Date.now();
    if (this.state.installAttempts >= this.MAX_INSTALL_ATTEMPTS) {
      console.warn('⚠️ Máximo número de intentos de instalación alcanzado');
      return false;
    }

    if (now - this.state.lastPromptTime < this.MIN_PROMPT_INTERVAL) {
      console.warn('⚠️ Muy pronto para otro intento de instalación');
      return false;
    }

    try {
      console.log('🚀 Iniciando instalación PWA...');
      
      // Mostrar prompt de instalación
      await this.state.deferredPrompt.prompt();
      
      // Esperar respuesta del usuario
      const choice = await this.state.deferredPrompt.userChoice;
      
      console.log('📊 Resultado instalación:', choice);
      
      // Actualizar estado
      this.state.lastPromptTime = now;
      this.state.installAttempts++;
      
      if (choice.outcome === 'accepted') {
        console.log('🎉 Usuario aceptó instalación');
        this.state.deferredPrompt = null;
        this.state.canInstall = false;
        
        this.saveState();
        this.notifyListeners();
        return true;
      } else {
        console.log('😔 Usuario rechazó instalación');
        this.saveState();
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error durante instalación:', error);
      this.state.installAttempts++;
      this.saveState();
      return false;
    }
  }

  /**
   * Diagnostica problemas de instalación
   */
  private logInstallationIssues(): void {
    console.log('🔧 === DIAGNÓSTICO PWA ANDROID ===');
    
    const issues = [];
    
    if (this.state.isStandalone) {
      issues.push('La app ya está instalada');
    }
    
    if (!document.querySelector('link[rel="manifest"]')) {
      issues.push('Manifest no encontrado en el DOM');
    }
    
    if (!('serviceWorker' in navigator)) {
      issues.push('Service Worker no soportado');
    }
    
    const isAndroid = /Android/.test(navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent) && !/Edg/.test(navigator.userAgent);
    
    if (!isAndroid) {
      issues.push('No es dispositivo Android');
    }
    
    if (!isChrome) {
      issues.push('No es Chrome Android');
    }
    
    if (this.state.installAttempts >= this.MAX_INSTALL_ATTEMPTS) {
      issues.push(`Máximo intentos alcanzado (${this.MAX_INSTALL_ATTEMPTS})`);
    }
    
    console.log('📱 Navegador:', navigator.userAgent);
    console.log('🔍 Problemas detectados:', issues.length > 0 ? issues : ['Ninguno detectado']);
    
    // Sugerencias para Android
    if (isAndroid && isChrome && !this.state.deferredPrompt) {
      console.log('💡 Sugerencias para Android Chrome:');
      console.log('   - Navegar por la app durante 30+ segundos');
      console.log('   - Interactuar con diferentes páginas');
      console.log('   - Esperar 5+ minutos entre intentos');
      console.log('   - Borrar datos del sitio y reintentar');
      console.log('   - Verificar que los iconos sean accesibles');
    }
  }

  /**
   * Obtiene el estado actual
   */
  public getState(): PWAInstallState {
    return { ...this.state };
  }

  /**
   * Suscribe a cambios de estado
   */
  public subscribe(callback: (state: PWAInstallState) => void): () => void {
    this.listeners.push(callback);
    
    // Llamar inmediatamente con estado actual
    callback(this.getState());
    
    // Retornar función de desuscripción
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Verifica si puede mostrar el prompt
   */
  public canShowInstallPrompt(): boolean {
    const now = Date.now();
    return this.state.canInstall && 
           this.state.deferredPrompt !== null &&
           this.state.installAttempts < this.MAX_INSTALL_ATTEMPTS &&
           (now - this.state.lastPromptTime) >= this.MIN_PROMPT_INTERVAL;
  }

  /**
   * Fuerza verificación de disponibilidad de instalación
   */
  public async recheckInstallability(): Promise<void> {
    console.log('🔄 Reverificando criterios de instalación...');
    
    // Resetear algunos estados para permitir nueva detección
    if (!this.state.isStandalone && this.state.installAttempts < this.MAX_INSTALL_ATTEMPTS) {
      this.state.canInstall = false;
      this.state.deferredPrompt = null;
    }
    
    await this.checkPWACriteria();
    this.saveState();
    this.notifyListeners();
  }

  /**
   * Guarda estado en localStorage
   */
  private saveState(): void {
    // Verificar que estamos en el navegador
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    try {
      const stateToSave = {
        ...this.state,
        deferredPrompt: null // No serializar el evento
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('⚠️ No se pudo guardar estado PWA:', error);
    }
  }

  /**
   * Carga estado desde localStorage
   */
  private loadState(): void {
    // Verificar que estamos en el navegador
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      console.log('⚠️ PWA Service: localStorage no disponible, usando estado por defecto');
      return;
    }

    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = { ...this.state, ...parsed, deferredPrompt: null };
      }
    } catch (error) {
      console.warn('⚠️ No se pudo cargar estado PWA:', error);
    }
  }

  /**
   * Notifica a todos los listeners
   */
  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('❌ Error en listener PWA:', error);
      }
    });
  }

  /**
   * Activa notificación PWA cuando está disponible para instalar
   */
  private triggerPWANotification(): void {
    try {
      // Solo notificar en dispositivos móviles y Chrome
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isChrome = /Chrome/.test(navigator.userAgent) && !/Edg/.test(navigator.userAgent);
      
      if (isMobile && isChrome) {
        console.log('📱 Activando notificación PWA...');
        
        // Importar dinámicamente el servicio de notificaciones para evitar dependencia circular
        import('@/services/clientNotificationService').then(() => {
          // Usar setTimeout para asegurar que el componente esté montado
          setTimeout(() => {
            try {
              // Crear evento personalizado para notificar PWA disponible
              window.dispatchEvent(new CustomEvent('pwaInstallAvailable', {
                detail: { canInstall: true }
              }));
            } catch (error) {
              console.warn('⚠️ Error activando notificación PWA:', error);
            }
          }, 2000); // Esperar 2 segundos después de detectar beforeinstallprompt
        });
      }
    } catch (error) {
      console.warn('⚠️ Error en triggerPWANotification:', error);
    }
  }
}

// Instancia singleton
export const pwaService = new PWAService();

// Funciones de utilidad principales
export const initializePWA = () => pwaService;
export const installPWA = () => pwaService.installPWA();
export const getPWAState = () => pwaService.getState();
export const subscribeToPWAState = (callback: (state: PWAInstallState) => void) => 
  pwaService.subscribe(callback);

// Funciones adicionales para compatibilidad con componentes existentes
export const isPWAInstalled = (): boolean => {
  const state = pwaService.getState();
  return state.isInstalled || state.isStandalone;
};

export const canInstallPWA = (): boolean => {
  return pwaService.canShowInstallPrompt();
};

export const checkPWAStatus = () => {
  return {
    isInstalled: isPWAInstalled(),
    canInstall: canInstallPWA(),
    isStandalone: pwaService.getState().isStandalone,
    hasPrompt: !!pwaService.getState().deferredPrompt
  };
};

// Funciones adicionales para compatibilidad con Dashboard
export const showPWANotificationIfAvailable = (): boolean => {
  const state = pwaService.getState();
  if (state.canInstall && !state.isInstalled) {
    console.log('📱 PWA disponible para instalación');
    return true;
  }
  return false;
};

export const forcePWACheck = async (): Promise<void> => {
  console.log('🔄 Forzando verificación PWA...');
  await pwaService.recheckInstallability();
};

export const verifyPWAConfigurationForBusiness = async (businessSlug?: string): Promise<boolean> => {
  console.log('🔧 Verificando configuración PWA para business:', businessSlug);
  
  // Verificar que el manifest sea accesible
  try {
    if (typeof document === 'undefined') return false;
    
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (!manifestLink) return false;
    
    const response = await fetch((manifestLink as HTMLLinkElement).href);
    if (!response.ok) return false;
    
    const manifest = await response.json();
    return !!(manifest.name && manifest.icons && manifest.start_url);
  } catch (error) {
    console.error('❌ Error verificando configuración PWA:', error);
    return false;
  }
};

// Para debugging
if (typeof window !== 'undefined') {
  (window as any).pwaService = pwaService;
  (window as any).debugPWA = () => {
    console.log('🔧 Debug PWA State:', pwaService.getState());
    pwaService.recheckInstallability();
  };
}

export default pwaService;
