/**
 * 🎯 HOOK PWA CENTRALIZADO
 * 
 * Reemplaza TODOS los hooks PWA duplicados:
 * ❌ usePWAConditional, usePWAInstall, etc.
 * 
 * ✅ UNA SOLA implementación que maneja:
 * - Estado PWA unificado
 * - Lógica de rutas centralizada  
 * - Integración con PWAController
 * - Compatibilidad con componentes existentes
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { 
  pwaController, 
  initializePWA, 
  updatePWARoute,
  installPWA,
  canInstallPWA,
  isPWAInstalled,
  isPWAButtonAllowed,
  subscribeToPWA,
  getPWAState,
  PWAState
} from '@/services/PWAController';

/**
 * 🎯 HOOK PRINCIPAL PWA
 * Maneja todo el estado y lógica PWA de forma centralizada
 */
export function usePWA() {
  const pathname = usePathname();
  const [state, setState] = useState<PWAState>(() => getPWAState());
  const [isReady, setIsReady] = useState(false);

  // Inicializar PWA Controller
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        await initializePWA(pathname);
        if (mounted) {
          setIsReady(true);
        }
      } catch (error) {
        console.error('Error inicializando PWA:', error);
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [pathname]);

  // Suscribirse a cambios de estado PWA
  useEffect(() => {
    const unsubscribe = subscribeToPWA((newState) => {
      setState(newState);
    });

    return unsubscribe;
  }, []);

  // Actualizar ruta cuando cambie
  useEffect(() => {
    if (isReady) {
      updatePWARoute(pathname);
    }
  }, [pathname, isReady]);

  // Función para instalar PWA
  const install = useCallback(async () => {
    return await installPWA();
  }, []);

  return {
    // Estado principal
    isReady,
    state,
    
    // Funciones de acción
    install,
    
    // Estados calculados
    canInstall: canInstallPWA(),
    isInstalled: isPWAInstalled(),
    isButtonAllowed: isPWAButtonAllowed(),
    
    // Información adicional
    currentRoute: pathname,
    deferredPrompt: state.deferredPrompt,
    
    // Para debugging
    debug: {
      state,
      controller: pwaController
    }
  };
}

/**
 * 🎯 HOOK SIMPLIFICADO PARA VERIFICAR SI MOSTRAR PWA
 * Reemplaza: usePWAConditional
 */
export function usePWAVisibility() {
  const { canInstall, isInstalled, isButtonAllowed, currentRoute } = usePWA();
  
  return {
    shouldShowPWA: canInstall && !isInstalled,
    shouldShowButton: isButtonAllowed && canInstall && !isInstalled,
    isInstalled,
    currentRoute,
    canInstall
  };
}

/**
 * 🎯 HOOK PARA INSTALACIÓN PWA
 * Reemplaza lógica duplicada de instalación
 */
export function usePWAInstall() {
  const { install, canInstall, isInstalled, state } = usePWA();
  const [isInstalling, setIsInstalling] = useState(false);
  const [installResult, setInstallResult] = useState<boolean | null>(null);

  const handleInstall = useCallback(async () => {
    if (isInstalling || !canInstall) return false;
    
    setIsInstalling(true);
    setInstallResult(null);
    
    try {
      const success = await install();
      setInstallResult(success);
      return success;
    } catch (error) {
      console.error('Error en instalación PWA:', error);
      setInstallResult(false);
      return false;
    } finally {
      setIsInstalling(false);
    }
  }, [install, canInstall, isInstalling]);

  return {
    install: handleInstall,
    isInstalling,
    canInstall,
    isInstalled,
    installResult,
    hasPrompt: !!state.deferredPrompt
  };
}

/**
 * 🎯 HOOK PARA RUTAS PWA
 * Centraliza toda la lógica de rutas permitidas/excluidas
 */
export function usePWARoutes() {
  const pathname = usePathname();
  
  // Configuración centralizada (debe coincidir con PWAController)
  const config = {
    excludedRoutes: ['/', '/signup', '/superadmin'],
    excludedPatterns: [
      /^\/[^/]+\/admin$/,    // /[businessId]/admin
      /^\/[^/]+\/staff$/,    // /[businessId]/staff
    ],
    buttonAllowedRoutes: ['/login']
  };

  const isExcluded = config.excludedRoutes.includes(pathname) ||
                    config.excludedPatterns.some(pattern => pattern.test(pathname));
  
  const isButtonAllowed = config.buttonAllowedRoutes.includes(pathname);

  return {
    currentRoute: pathname,
    isAllowed: !isExcluded,
    isExcluded,
    isButtonAllowed,
    config
  };
}

/**
 * 🎯 HOOK PARA NOTIFICACIONES PWA
 * Centraliza la lógica de notificaciones PWA
 */
export function usePWANotifications() {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'install' | 'success' | 'error';
    message: string;
    timestamp: number;
  }>>([]);

  useEffect(() => {
    const handleInstallAvailable = () => {
      setNotifications(prev => [...prev, {
        id: `install-${Date.now()}`,
        type: 'install',
        message: 'PWA disponible para instalación',
        timestamp: Date.now()
      }]);
    };

    const handleInstallSuccess = () => {
      setNotifications(prev => [...prev, {
        id: `success-${Date.now()}`,
        type: 'success', 
        message: 'PWA instalada exitosamente',
        timestamp: Date.now()
      }]);
    };

    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('pwa-install-success', handleInstallSuccess);

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('pwa-install-success', handleInstallSuccess);
    };
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    dismissNotification,
    clearAll,
    hasNotifications: notifications.length > 0
  };
}

/**
 * 🎯 HOOK PARA DISPOSITIVOS PWA
 * Detecta tipo de dispositivo y configuración apropiada
 */
export function usePWADevice() {
  const [deviceType, setDeviceType] = useState<'desktop' | 'mobile' | 'tablet'>('desktop');
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detectar tipo de dispositivo
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('tablet') || (userAgent.includes('android') && !userAgent.includes('mobile'))) {
      setDeviceType('tablet');
    } else if (userAgent.includes('mobile')) {
      setDeviceType('mobile');
    } else {
      setDeviceType('desktop');
    }

    // Detectar modo standalone
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true;
      setIsStandalone(standalone);
    };

    checkStandalone();
    
    // Escuchar cambios
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = () => checkStandalone();
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return {
    deviceType,
    isStandalone,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    
    // Configuración recomendada por dispositivo
    getRecommendedConfig: () => {
      switch (deviceType) {
        case 'mobile':
          return {
            position: 'bottom' as const,
            variant: 'mobile' as const,
            delay: 2000,
            autoShow: true
          };
        case 'tablet':
          return {
            position: 'floating' as const,
            variant: 'mobile' as const,
            delay: 3000,
            autoShow: true
          };
        default:
          return {
            position: 'bottom' as const,
            variant: 'desktop' as const,
            delay: 5000,
            autoShow: false
          };
      }
    }
  };
}

/**
 * 🎯 FUNCIONES DE COMPATIBILIDAD
 * Para migración gradual desde hooks antiguos
 */

// Reemplaza: usePWAConditional
export function usePWAConditional() {
  const { shouldShowPWA } = usePWAVisibility();
  return shouldShowPWA;
}

// Reemplaza: shouldShowPWAForRoute
export function shouldShowPWAForRoute(pathname: string): boolean {
  const config = {
    excludedRoutes: ['/', '/signup', '/superadmin'],
    excludedPatterns: [
      /^\/[^/]+\/admin$/,
      /^\/[^/]+\/staff$/,
    ]
  };
  
  return !config.excludedRoutes.includes(pathname) &&
         !config.excludedPatterns.some(pattern => pattern.test(pathname));
}

// Reemplaza: shouldShowPWAButtonForRoute  
export function shouldShowPWAButtonForRoute(pathname: string): boolean {
  return ['/login'].includes(pathname);
}

export default usePWA;
