/**
 * 🎯 PWA CONTROLLER CENTRALIZADO
 * 
 * Reemplaza toda la lógica PWA fragmentada con una solución única y limpia:
 * - UN SOLO listener para beforeinstallprompt
 * - UN SOLO estado PWA global
 * - UNA SOLA notificación por evento
 * - UNA SOLA lógica de rutas
 * 
 * Elimina la duplicación de:
 * - PWAService, PWAManager, PWAInstallPrompt, PWAInstallButton
 * - SimplePWAPrompt, ConditionalPWAPrompt, etc.
 */

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  deferredPrompt: BeforeInstallPromptEvent | null;
  lastPromptTime: number;
  installAttempts: number;
  currentRoute: string;
}

interface PWAConfig {
  // Rutas donde NO mostrar PWA
  excludedRoutes: string[];
  excludedPatterns: RegExp[];
  
  // Rutas donde SÍ mostrar PWA (más restrictivo para botón)
  buttonAllowedRoutes: string[];
  
  // Configuración de intervalos
  minPromptInterval: number; // ms entre prompts
  maxInstallAttempts: number;
  
  // Configuración de UI
  autoShowDelay: number; // ms delay para mostrar automáticamente
  enableNotifications: boolean;
}

type PWAEventCallback = (state: PWAState) => void;

export class PWAController {
  private state: PWAState = {
    isInstallable: false,
    isInstalled: false,
    isStandalone: false,
    deferredPrompt: null,
    lastPromptTime: 0,
    installAttempts: 0,
    currentRoute: '/'
  };

  private config: PWAConfig = {
    excludedRoutes: ['/', '/signup', '/superadmin'],
    excludedPatterns: [
      /^\/[^/]+\/admin$/,    // /[businessId]/admin
      /^\/[^/]+\/staff$/,    // /[businessId]/staff
    ],
    buttonAllowedRoutes: ['/cliente'],  // Solo mostrar en /cliente
    minPromptInterval: 300000, // 5 minutos
    maxInstallAttempts: 3,
    autoShowDelay: 3000,
    enableNotifications: false  // 🔥 DESHABILITADO para evitar molestia en iOS
  };

  private listeners: PWAEventCallback[] = [];
  private isInitialized = false;
  private readonly STORAGE_KEY = 'lealta_pwa_controller_state';

  /**
   * 🚀 INICIALIZACIÓN ÚNICA
   */
  async initialize(pathname: string = '/'): Promise<void> {
    if (this.isInitialized) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 PWAController ya inicializado');
      }
      return;
    }

    if (typeof window === 'undefined') {
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ PWAController: Entorno servidor, saltando inicialización');
      }
      return;
    }

    try {
      // Cargar estado persistido
      this.loadPersistedState();
      
      // Actualizar ruta actual
      this.updateRoute(pathname);
      
      // Detectar si ya está instalado
      this.detectStandaloneMode();
      
      // Registrar Service Worker
      await this.ensureServiceWorker();
      
      // ✅ UN SOLO LISTENER para beforeinstallprompt
      this.setupInstallPromptListener();
      
      // Detectar cambios en display mode
      this.setupDisplayModeListener();
      
      // Marcar como inicializado
      this.isInitialized = true;
      
      this.notifyListeners();
      
    } catch (error) {
      console.error('❌ Error inicializando PWAController:', error);
    }
  }

  /**
   * 🎯 ACTUALIZAR RUTA ACTUAL
   */
  updateRoute(pathname: string): void {
    const oldRoute = this.state.currentRoute;
    this.state.currentRoute = pathname;
    
    if (oldRoute !== pathname) {
      this.notifyListeners();
    }
  }

  /**
   * 🎯 DETECTAR MODO STANDALONE
   */
  private detectStandaloneMode(): void {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true;
    
    this.state.isStandalone = isStandalone;
    this.state.isInstalled = isStandalone;
  }

  /**
   * 🎯 DETECTAR SI ES iOS
   */
  isIOS(): boolean {
    if (typeof window === 'undefined') return false;
    
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
  }

  /**
   * 🎯 DETECTAR SI ES iOS SAFARI
   */
  isIOSSafari(): boolean {
    if (!this.isIOS()) return false;
    
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /safari/.test(userAgent) && !/crios|fxios|edgios/.test(userAgent);
  }

  /**
   * 🎯 ASEGURAR SERVICE WORKER
   */
  private async ensureServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️ Service Worker no soportado');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (!registration) {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      }
    } catch (error) {
      console.warn('⚠️ Error con Service Worker:', error);
    }
  }

  /**
   * 🎯 UN SOLO LISTENER PARA BEFOREINSTALLPROMPT
   */
  private setupInstallPromptListener(): void {
    // Remover cualquier listener existente para evitar duplicados
    window.removeEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt);
    
    // Agregar el listener único
    window.addEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt);
    
    // Listener para cuando se instala
    window.addEventListener('appinstalled', this.handleAppInstalled);
  }

  /**
   * 🎯 MANEJADOR ÚNICO DE BEFOREINSTALLPROMPT
   */
  private readonly handleBeforeInstallPrompt = (e: Event) => {
    const event = e as BeforeInstallPromptEvent;
    
    // 🚫 iOS no dispara este evento, solo Android/Chrome
    // Si llegamos aquí, es un navegador compatible con PWA nativo
    
    // Verificar si está permitido en la ruta actual
    const isRouteAllowed = this.isRouteAllowed();
    
    if (!isRouteAllowed) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    
    // Prevenir prompt automático del navegador
    e.preventDefault();
    
    // Guardar prompt para uso posterior
    this.state.deferredPrompt = event;
    this.state.isInstallable = true;
    
    // Guardar estado
    this.saveState();
    
    // ✅ UNA SOLA NOTIFICACIÓN (solo si notifications están habilitadas)
    if (this.config.enableNotifications) {
      this.showInstallNotification();
    }
    
    // Notificar a componentes suscritos
    this.notifyListeners();
  };

  /**
   * 🎯 MANEJADOR DE APP INSTALADA
   */
  private readonly handleAppInstalled = () => {
    this.state.isInstalled = true;
    this.state.isInstallable = false;
    this.state.deferredPrompt = null;
    
    this.saveState();
    this.notifyListeners();
    
    // Mostrar notificación de éxito
    if (this.config.enableNotifications) {
      this.showSuccessNotification();
    }
  };

  /**
   * 🎯 VERIFICAR SI RUTA PERMITE PWA
   */
  private isRouteAllowed(): boolean {
    const { currentRoute } = this.state;
    
    return !this.config.excludedRoutes.includes(currentRoute) &&
           !this.config.excludedPatterns.some(pattern => pattern.test(currentRoute));
  }

  /**
   * 🎯 VERIFICAR SI BOTÓN ESTÁ PERMITIDO
   */
  isButtonAllowed(): boolean {
    return this.config.buttonAllowedRoutes.includes(this.state.currentRoute);
  }

  /**
   * 🎯 INSTALAR PWA
   */
  async install(): Promise<boolean> {
    if (!this.state.deferredPrompt) {
      console.warn('❌ No hay prompt de instalación disponible');
      return false;
    }

    // Verificar límites
    const now = Date.now();
    if (this.state.installAttempts >= this.config.maxInstallAttempts) {
      console.warn('⚠️ Máximo número de intentos alcanzado');
      return false;
    }

    if (now - this.state.lastPromptTime < this.config.minPromptInterval) {
      console.warn('⚠️ Muy pronto para otro intento');
      return false;
    }

    try {
      await this.state.deferredPrompt.prompt();
      const choice = await this.state.deferredPrompt.userChoice;
      
      this.state.lastPromptTime = now;
      this.state.installAttempts++;
      
      if (choice.outcome === 'accepted') {
        this.state.deferredPrompt = null;
        this.state.isInstallable = false;
        this.saveState();
        this.notifyListeners();
        return true;
      } else {
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
   * 🎯 MOSTRAR NOTIFICACIÓN DE INSTALACIÓN (UNA SOLA)
   */
  private showInstallNotification(): void {
    if (!this.config.enableNotifications) return;
    
    // Usar setTimeout para asegurar que componentes estén montados
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('pwa-install-available', {
        detail: {
          route: this.state.currentRoute,
          canInstall: this.state.isInstallable,
          isButtonAllowed: this.isButtonAllowed()
        }
      }));
    }, 100);
  }

  /**
   * 🎯 MOSTRAR NOTIFICACIÓN DE ÉXITO
   */
  private showSuccessNotification(): void {
    window.dispatchEvent(new CustomEvent('pwa-install-success', {
      detail: { message: '¡Aplicación instalada exitosamente!' }
    }));
  }

  /**
   * 🎯 LISTENER PARA CAMBIOS DE DISPLAY MODE
   */
  private setupDisplayModeListener(): void {
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      this.state.isStandalone = e.matches;
      this.state.isInstalled = e.matches;
      
      if (e.matches) {
        this.state.isInstallable = false;
        this.state.deferredPrompt = null;
      }
      
      this.saveState();
      this.notifyListeners();
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleDisplayModeChange);
    } else {
      // Fallback para navegadores antiguos
      mediaQuery.addListener(handleDisplayModeChange);
    }
  }

  /**
   * 🎯 SUSCRIBIRSE A CAMBIOS DE ESTADO
   */
  subscribe(callback: PWAEventCallback): () => void {
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
   * 🎯 OBTENER ESTADO ACTUAL
   */
  getState(): PWAState {
    return { ...this.state };
  }

  /**
   * 🎯 VERIFICAR SI PUEDE INSTALAR
   */
  canInstall(): boolean {
    return this.state.isInstallable && 
           !this.state.isInstalled && 
           this.isRouteAllowed() &&
           this.state.deferredPrompt !== null;
  }

  /**
   * 🎯 VERIFICAR SI ESTÁ INSTALADO
   */
  isInstalled(): boolean {
    return this.state.isInstalled || this.state.isStandalone;
  }

  /**
   * 🎯 NOTIFICAR LISTENERS
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.getState());
      } catch (error) {
        console.error('❌ Error en PWA listener:', error);
      }
    });
  }

  /**
   * 🎯 GUARDAR ESTADO
   */
  private saveState(): void {
    try {
      const stateToSave = {
        ...this.state,
        deferredPrompt: null // No serializar el evento
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('⚠️ Error guardando estado PWA:', error);
    }
  }

  /**
   * 🎯 CARGAR ESTADO PERSISTIDO
   */
  private loadPersistedState(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsedState = JSON.parse(saved);
        this.state = { 
          ...this.state, 
          ...parsedState,
          deferredPrompt: null // Nunca persistir el evento
        };
      }
    } catch (error) {
      console.warn('⚠️ Error cargando estado PWA:', error);
    }
  }

  /**
   * 🎯 LIMPIAR CONTROLADOR
   */
  cleanup(): void {
    window.removeEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt);
    window.removeEventListener('appinstalled', this.handleAppInstalled);
    this.listeners.length = 0;
    this.isInitialized = false;
  }
}

// 🎯 INSTANCIA SINGLETON
export const pwaController = new PWAController();

// 🎯 FUNCIONES DE UTILIDAD SIMPLIFICADAS
export const initializePWA = (pathname: string = '/') => pwaController.initialize(pathname);
export const updatePWARoute = (pathname: string) => pwaController.updateRoute(pathname);
export const installPWA = () => pwaController.install();
export const canInstallPWA = () => pwaController.canInstall();
export const isPWAInstalled = () => pwaController.isInstalled();
export const isPWAButtonAllowed = () => pwaController.isButtonAllowed();
export const subscribeToPWA = (callback: PWAEventCallback) => pwaController.subscribe(callback);
export const getPWAState = () => pwaController.getState();

// 🎯 FUNCIONES DE COMPATIBILIDAD (para migración gradual)
export const getPWAStatus = () => ({
  isInstalled: isPWAInstalled(),
  canInstall: canInstallPWA(),
  isStandalone: pwaController.getState().isStandalone,
  hasPrompt: !!pwaController.getState().deferredPrompt
});

export default pwaController;
