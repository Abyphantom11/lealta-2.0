/**
 * Utilidades para gestión de cookies y consentimiento
 * Sistema de cookies compatible con GDPR/CCPA
 */

export interface CookieConsent {
  readonly necessary: boolean;
  readonly analytics: boolean;
  readonly marketing: boolean;
  readonly functional: boolean;
  readonly timestamp: number;
}

export interface CookieSettings {
  readonly hasConsent: boolean;
  readonly consent: CookieConsent | null;
  readonly canUseAnalytics: boolean;
  readonly canUseMarketing: boolean;
  readonly canUseFunctional: boolean;
}

const CONSENT_KEY = 'lealta-cookie-consent';

/**
 * Obtiene la configuración actual de cookies
 */
export function getCookieSettings(): CookieSettings {
  if (typeof window === 'undefined') {
    return {
      hasConsent: false,
      consent: null,
      canUseAnalytics: false,
      canUseMarketing: false,
      canUseFunctional: false,
    };
  }

  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      return {
        hasConsent: false,
        consent: null,
        canUseAnalytics: false,
        canUseMarketing: false,
        canUseFunctional: false,
      };
    }

    const consent: CookieConsent = JSON.parse(stored);
    
    // Verificar que el consentimiento no sea muy antiguo (6 meses)
    const sixMonthsAgo = Date.now() - (6 * 30 * 24 * 60 * 60 * 1000);
    if (consent.timestamp < sixMonthsAgo) {
      localStorage.removeItem(CONSENT_KEY);
      return {
        hasConsent: false,
        consent: null,
        canUseAnalytics: false,
        canUseMarketing: false,
        canUseFunctional: false,
      };
    }

    return {
      hasConsent: true,
      consent,
      canUseAnalytics: consent.analytics,
      canUseMarketing: consent.marketing,
      canUseFunctional: consent.functional,
    };
  } catch (error) {
    console.error('Error reading cookie consent:', error);
    return {
      hasConsent: false,
      consent: null,
      canUseAnalytics: false,
      canUseMarketing: false,
      canUseFunctional: false,
    };
  }
}

/**
 * Establece el consentimiento de cookies
 */
export function setCookieConsent(consent: Omit<CookieConsent, 'timestamp'>): void {
  if (typeof window === 'undefined') return;

  const consentWithTimestamp: CookieConsent = {
    ...consent,
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consentWithTimestamp));
    
    // Disparar evento personalizado para que otros componentes puedan reaccionar
    window.dispatchEvent(new CustomEvent('cookieConsentChanged', {
      detail: consentWithTimestamp
    }));
    
    // Aplicar configuración inmediatamente
    applyCookieSettings(consentWithTimestamp);
  } catch (error) {
    console.error('Error setting cookie consent:', error);
  }
}

/**
 * Revoca el consentimiento de cookies
 */
export function revokeCookieConsent(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(CONSENT_KEY);
    
    // Limpiar cookies de tracking si existen
    clearTrackingCookies();
    
    window.dispatchEvent(new CustomEvent('cookieConsentRevoked'));
  } catch (error) {
    console.error('Error revoking cookie consent:', error);
  }
}

/**
 * Aplica la configuración de cookies
 */
function applyCookieSettings(consent: CookieConsent): void {
  // Analytics
  if (consent.analytics) {
    // Inicializar analytics (Google Analytics, etc.)
    initializeAnalytics();
  } else {
    // Deshabilitar analytics
    disableAnalytics();
  }

  // Marketing
  if (consent.marketing) {
    // Inicializar tracking de marketing
    initializeMarketing();
  } else {
    // Deshabilitar marketing tracking
    disableMarketing();
  }

  // Functional
  if (consent.functional) {
    // Habilitar cookies funcionales (preferencias, etc.)
    initializeFunctional();
  }
}

/**
 * Inicializa Google Analytics (si se usa)
 */
function initializeAnalytics(): void {
  // Aquí iría la inicialización de Google Analytics
  // Solo como ejemplo, puedes remover si no usas GA
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('consent', 'update', {
      analytics_storage: 'granted'
    });
  }
}

/**
 * Deshabilita analytics
 */
function disableAnalytics(): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('consent', 'update', {
      analytics_storage: 'denied'
    });
  }
}

/**
 * Inicializa tracking de marketing
 */
function initializeMarketing(): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('consent', 'update', {
      ad_storage: 'granted'
    });
  }
}

/**
 * Deshabilita marketing tracking
 */
function disableMarketing(): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('consent', 'update', {
      ad_storage: 'denied'
    });
  }
}

/**
 * Inicializa cookies funcionales
 */
function initializeFunctional(): void {
  // Aquí puedes inicializar cookies funcionales como:
  // - Preferencias de idioma
  // - Configuración de UI
  // - Estado de sesión extendida
}

/**
 * Limpia cookies de tracking
 */
function clearTrackingCookies(): void {
  if (typeof document === 'undefined') return;

  // Lista de cookies comunes de tracking para limpiar
  const trackingCookies = [
    '_ga',
    '_ga_*',
    '_gid',
    '_gat',
    '_gat_*',
    '_gcl_*',
    'AMP_TOKEN',
    '_dc_gtm_*',
    '__utma',
    '__utmb',
    '__utmc',
    '__utmt',
    '__utmz',
    '_fbp',
    '_fbc',
    'fr'
  ];

  trackingCookies.forEach(cookieName => {
    if (cookieName.includes('*')) {
      // Para cookies con wildcards, buscar todas las que coincidan
      const prefix = cookieName.replace('*', '');
      document.cookie.split(';').forEach(cookie => {
        const name = cookie.split('=')[0].trim();
        if (name.startsWith(prefix)) {
          deleteCookie(name);
        }
      });
    } else {
      deleteCookie(cookieName);
    }
  });
}

/**
 * Elimina una cookie específica
 */
function deleteCookie(name: string): void {
  const domains = [window.location.hostname, `.${window.location.hostname}`];
  const paths = ['/', ''];

  domains.forEach(domain => {
    paths.forEach(path => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${domain}; path=${path}`;
    });
  });
}

/**
 * Hook para React que devuelve el estado de cookies
 */
export function useCookieConsent() {
  if (typeof window === 'undefined') {
    return {
      hasConsent: false,
      consent: null,
      canUseAnalytics: false,
      canUseMarketing: false,
      canUseFunctional: false,
      setCookieConsent,
      revokeCookieConsent,
    };
  }

  const settings = getCookieSettings();
  
  return {
    ...settings,
    setCookieConsent,
    revokeCookieConsent,
  };
}

// Tipos para window.gtag (si usas Google Analytics)
declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, unknown>
    ) => void;
  }
}
