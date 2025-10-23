import { useState, useEffect } from 'react';

export type ShareCompatibility = 
  | 'optimal'      // Definitivamente soporta texto + archivos
  | 'likely'       // Probablemente funciona
  | 'unlikely'     // Probablemente NO funciona
  | 'unsupported'; // Definitivamente NO soporta

export interface DetailedShareCapabilities {
  // Navegador
  browser: 'chrome' | 'safari' | 'firefox' | 'edge' | 'opera' | 'brave' | 'samsung' | 'other';
  browserVersion: number | null;
  browserEngine: 'chromium' | 'webkit' | 'gecko' | 'other'; // Motor del navegador
  
  // OS
  os: 'android' | 'ios' | 'windows' | 'macos' | 'linux' | 'other';
  osVersion: string | null;
  isMobile: boolean;
  
  // Capacidades
  hasShareAPI: boolean;
  canShareFiles: boolean;
  canShareText: boolean;
  canShareBoth: boolean;
  hasClipboardAPI: boolean;
  
  // Compatibilidad estimada
  compatibility: ShareCompatibility;
  confidence: number; // 0-100
  
  // Razones
  compatibilityReason: string;
  recommendedAction: string;
}

/**
 * 🔍 Hook mejorado con detección profunda de compatibilidad
 */
export function useDetailedShareCapabilities(): DetailedShareCapabilities {
  const [capabilities, setCapabilities] = useState<DetailedShareCapabilities>(() => 
    detectDetailedCapabilities()
  );

  useEffect(() => {
    // Detectar solo una vez al montar
    const detected = detectDetailedCapabilities();
    setCapabilities(detected);
    
    // NO re-detectar en cambios posteriores para mantener consistencia
  }, []); // Array vacío = solo al montar

  return capabilities;
}

/**
 * 🎯 Detecta capacidades detalladas del navegador y OS
 */
function detectDetailedCapabilities(): DetailedShareCapabilities {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  
  // Detectar OS y versión
  const osInfo = detectOS(ua);
  
  // Detectar navegador
  const browserInfo = detectBrowser(ua);
  
  // Capacidades básicas de Share API
  const hasShareAPI = typeof navigator !== 'undefined' && 'share' in navigator;
  
  let canShareFiles = false;
  let canShareText = false;
  let canShareBoth = false;
  
  if (hasShareAPI && navigator.canShare) {
    try {
      const testBlob = new Blob(['test'], { type: 'image/png' });
      const testFile = new File([testBlob], 'test.png', { type: 'image/png' });
      
      canShareFiles = navigator.canShare({ files: [testFile] });
      canShareText = navigator.canShare({ text: 'test' });
      canShareBoth = navigator.canShare({ text: 'test', files: [testFile] });
    } catch (error) {
      console.warn('Error detectando capacidades:', error);
    }
  }
  
  const hasClipboardAPI = typeof navigator !== 'undefined' && 
                          'clipboard' in navigator && 
                          'writeText' in navigator.clipboard;
  
  // Determinar compatibilidad basada en OS, navegador y versión
  const { compatibility, confidence, reason, action } = assessCompatibility({
    os: osInfo.os,
    osVersion: osInfo.version,
    browser: browserInfo.browser,
    browserVersion: browserInfo.version,
    browserEngine: browserInfo.engine,
    isMobile: osInfo.isMobile,
    canShareBoth,
    hasShareAPI,
  });
  
  return {
    browser: browserInfo.browser,
    browserVersion: browserInfo.version,
    browserEngine: browserInfo.engine,
    os: osInfo.os,
    osVersion: osInfo.version,
    isMobile: osInfo.isMobile,
    hasShareAPI,
    canShareFiles,
    canShareText,
    canShareBoth,
    hasClipboardAPI,
    compatibility,
    confidence,
    compatibilityReason: reason,
    recommendedAction: action,
  };
}

/**
 * 🖥️ Detecta el sistema operativo y versión
 */
function detectOS(ua: string): { os: 'android' | 'ios' | 'windows' | 'macos' | 'linux' | 'other', version: string | null, isMobile: boolean } {
  let os: 'android' | 'ios' | 'windows' | 'macos' | 'linux' | 'other' = 'other';
  let version: string | null = null;
  let isMobile = false;
  
  // Android
  if (/Android/i.test(ua)) {
    os = 'android';
    isMobile = true;
    const match = ua.match(/Android\s+([\d.]+)/);
    version = match ? match[1] : null;
  }
  // iOS
  else if (/iPhone|iPad|iPod/i.test(ua)) {
    os = 'ios';
    isMobile = /iPhone|iPod/i.test(ua);
    const match = ua.match(/OS\s+([\d_]+)/);
    version = match ? match[1].replace(/_/g, '.') : null;
  }
  // Windows
  else if (/Windows/i.test(ua)) {
    os = 'windows';
    isMobile = /Windows Phone/i.test(ua);
  }
  // macOS
  else if (/Macintosh|Mac OS X/i.test(ua)) {
    os = 'macos';
    const match = ua.match(/Mac OS X\s+([\d_]+)/);
    version = match ? match[1].replace(/_/g, '.') : null;
  }
  // Linux
  else if (/Linux/i.test(ua)) {
    os = 'linux';
  }
  
  return { os, version, isMobile };
}

/**
 * 🌐 Detecta el navegador y versión con mayor precisión
 */
function detectBrowser(ua: string): { 
  browser: 'chrome' | 'safari' | 'firefox' | 'edge' | 'opera' | 'brave' | 'samsung' | 'other';
  version: number | null;
  engine: 'chromium' | 'webkit' | 'gecko' | 'other';
} {
  let browser: 'chrome' | 'safari' | 'firefox' | 'edge' | 'opera' | 'brave' | 'samsung' | 'other' = 'other';
  let version: number | null = null;
  let engine: 'chromium' | 'webkit' | 'gecko' | 'other' = 'other';
  
  // Opera (debe ir antes que Chrome)
  if (/OPR\//i.test(ua) || /Opera/i.test(ua)) {
    browser = 'opera';
    engine = 'chromium';
    const match = /OPR\/([\d.]+)/.exec(ua) || /Opera\/([\d.]+)/.exec(ua);
    version = match ? Number.parseInt(match[1], 10) : null;
  }
  // Edge (debe ir antes que Chrome)
  else if (/Edg\//i.test(ua)) {
    browser = 'edge';
    engine = 'chromium';
    const match = /Edg\/([\d.]+)/.exec(ua);
    version = match ? Number.parseInt(match[1], 10) : null;
  }
  // Brave (difícil de detectar, usa Chrome UA)
  else if ((navigator as any).brave && typeof (navigator as any).brave.isBrave === 'function') {
    browser = 'brave';
    engine = 'chromium';
    const match = /Chrome\/([\d.]+)/.exec(ua);
    version = match ? Number.parseInt(match[1], 10) : null;
  }
  // Samsung Internet
  else if (/SamsungBrowser\//i.test(ua)) {
    browser = 'samsung';
    engine = 'chromium';
    const match = /SamsungBrowser\/([\d.]+)/.exec(ua);
    version = match ? Number.parseInt(match[1], 10) : null;
  }
  // Chrome (después de verificar otros basados en Chromium)
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua) && !/OPR\//i.test(ua)) {
    browser = 'chrome';
    engine = 'chromium';
    const match = /Chrome\/([\d.]+)/.exec(ua);
    version = match ? Number.parseInt(match[1], 10) : null;
  }
  // Safari
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) {
    browser = 'safari';
    engine = 'webkit';
    const match = /Version\/([\d.]+)/.exec(ua);
    version = match ? Number.parseInt(match[1], 10) : null;
  }
  // Firefox
  else if (/Firefox\//i.test(ua)) {
    browser = 'firefox';
    engine = 'gecko';
    const match = /Firefox\/([\d.]+)/.exec(ua);
    version = match ? Number.parseInt(match[1], 10) : null;
  }
  
  return { browser, version, engine };
}

/**
 * 🎯 Evalúa la compatibilidad real basada en datos conocidos
 * NOTA: Prioriza la detección por navegador/OS sobre canShareBoth para ser más determinística
 */
function assessCompatibility(params: {
  os: string;
  osVersion: string | null;
  browser: string;
  browserVersion: number | null;
  browserEngine: string;
  isMobile: boolean;
  canShareBoth: boolean;
  hasShareAPI: boolean;
}): { 
  compatibility: ShareCompatibility;
  confidence: number;
  reason: string;
  action: string;
} {
  const { os, osVersion, browser, browserEngine, isMobile, canShareBoth, hasShareAPI } = params;
  
  // iOS: Comportamiento conocido problemático
  if (os === 'ios') {
    const iosVersion = osVersion ? parseFloat(osVersion) : 0;
    
    // iOS 15.4+ con Safari: Funciona bien
    if (browser === 'safari' && iosVersion >= 15.4 && canShareBoth) {
      return {
        compatibility: 'likely',
        confidence: 75,
        reason: 'iOS 15.4+ con Safari suele funcionar, pero WhatsApp puede ignorar el texto',
        action: 'Se copiará el mensaje como respaldo. Si no funciona, pégalo manualmente.',
      };
    }
    
    // iOS 14 o menor: Probablemente no funciona
    if (iosVersion < 15) {
      return {
        compatibility: 'unlikely',
        confidence: 80,
        reason: 'iOS anterior a 15 tiene soporte limitado de Share API',
        action: 'El mensaje se copiará automáticamente. Pégalo en WhatsApp.',
      };
    }
    
    // iOS con Chrome/otros navegadores: Menos confiable
    if (browser !== 'safari') {
      return {
        compatibility: 'unlikely',
        confidence: 70,
        reason: 'Navegadores de terceros en iOS tienen limitaciones del sistema',
        action: 'El mensaje se copiará automáticamente. Pégalo en WhatsApp.',
      };
    }
    
    // iOS genérico con Share API
    if (canShareBoth) {
      return {
        compatibility: 'likely',
        confidence: 60,
        reason: 'Tu dispositivo indica soporte, pero WhatsApp puede ignorar el texto',
        action: 'Se copiará el mensaje como respaldo. Pégalo si no aparece automáticamente.',
      };
    }
    
    return {
      compatibility: 'unlikely',
      confidence: 65,
      reason: 'iOS con WhatsApp típicamente ignora el texto al compartir imágenes',
      action: 'El mensaje se copiará automáticamente. Pégalo en WhatsApp.',
    };
  }
  
  // Android: Más confiable pero depende de la versión de WhatsApp
  if (os === 'android') {
    const androidVersion = osVersion ? parseFloat(osVersion) : 0;
    
    // Android 10+ con Chrome: Generalmente funciona
    if (browser === 'chrome' && androidVersion >= 10 && canShareBoth) {
      return {
        compatibility: 'likely',
        confidence: 70,
        reason: 'Android 10+ con Chrome suele funcionar, pero la app receptora decide',
        action: 'Se intentará enviar juntos. Si no funciona, el mensaje estará copiado.',
      };
    }
    
    // Android con Share API
    if (canShareBoth) {
      return {
        compatibility: 'likely',
        confidence: 65,
        reason: 'Android soporta Share API, pero WhatsApp puede priorizar la imagen',
        action: 'Se copiará el mensaje como respaldo por si acaso.',
      };
    }
    
    return {
      compatibility: 'unlikely',
      confidence: 60,
      reason: 'WhatsApp en Android suele priorizar imágenes sobre texto',
      action: 'El mensaje se copiará automáticamente. Pégalo en WhatsApp.',
    };
  }
  
  // Desktop: Generalmente mejor soporte
  if (!isMobile) {
    // Navegadores basados en Chromium en Desktop
    if (browserEngine === 'chromium' && hasShareAPI) {
      // Determinar nombre del navegador
      let browserName = 'Chromium';
      if (browser === 'chrome') browserName = 'Chrome';
      else if (browser === 'edge') browserName = 'Edge';
      else if (browser === 'opera') browserName = 'Opera';
      else if (browser === 'brave') browserName = 'Brave';
      
      // Desktop con Share API es óptimo
      if (canShareBoth) {
        return {
          compatibility: 'optimal',
          confidence: 95,
          reason: `${browserName} Desktop con Share API completa`,
          action: 'El QR y mensaje se enviarán juntos directamente.',
        };
      }
      
      // Tiene Share API pero no detecta canShareBoth (puede ser falso negativo)
      return {
        compatibility: 'likely',
        confidence: 85,
        reason: `${browserName} Desktop soporta compartir, verificaremos en tiempo real`,
        action: 'Se intentará enviar juntos, con respaldo en portapapeles.',
      };
    }
    
    // Desktop sin Share API: Usar clipboard
    return {
      compatibility: 'likely',
      confidence: 80,
      reason: 'Desktop puede usar portapapeles para compartir',
      action: 'Se copiarán imagen y mensaje. Pégalos en WhatsApp Web.',
    };
  }
  
  // Caso genérico: Móvil sin identificar
  if (isMobile && canShareBoth) {
    return {
      compatibility: 'likely',
      confidence: 50,
      reason: 'Tu dispositivo indica soporte, pero la compatibilidad real varía por app',
      action: 'Se copiará el mensaje como respaldo. Pégalo si no aparece automáticamente.',
    };
  }
  
  // Fallback: Sin soporte
  return {
    compatibility: 'unsupported',
    confidence: 90,
    reason: 'Tu dispositivo no soporta compartir archivos nativamente',
    action: 'Se descargará el QR y se copiará el mensaje.',
  };
}

/**
 * 🎨 Obtiene emoji y color según compatibilidad
 */
export function getCompatibilityUI(compatibility: ShareCompatibility): { 
  emoji: string; 
  color: string; 
  label: string;
  badgeColor: string;
} {
  switch (compatibility) {
    case 'optimal':
      return { 
        emoji: '✨', 
        color: 'text-green-600', 
        label: 'Compatibilidad Óptima',
        badgeColor: 'bg-green-100 text-green-800 border-green-300',
      };
    case 'likely':
      return { 
        emoji: '👍', 
        color: 'text-blue-600', 
        label: 'Probablemente Compatible',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
      };
    case 'unlikely':
      return { 
        emoji: '⚠️', 
        color: 'text-orange-600', 
        label: 'Compatibilidad Limitada',
        badgeColor: 'bg-orange-100 text-orange-800 border-orange-300',
      };
    case 'unsupported':
      return { 
        emoji: '❌', 
        color: 'text-red-600', 
        label: 'No Soportado',
        badgeColor: 'bg-red-100 text-red-800 border-red-300',
      };
  }
}
