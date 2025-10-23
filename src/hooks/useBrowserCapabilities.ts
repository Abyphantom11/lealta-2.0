import { useState, useEffect } from 'react';

export type ShareStrategy = 'direct' | 'clipboard' | 'download';

export interface BrowserCapabilities {
  // Navegador
  isChrome: boolean;
  chromeVersion: number | null;
  isMobile: boolean;
  
  // Capacidades de Share API
  hasShareAPI: boolean;
  canShareFiles: boolean;
  canShareText: boolean;
  canShareBoth: boolean;
  
  // Capacidades de Clipboard
  hasClipboardAPI: boolean;
  canWriteClipboardImages: boolean;
  
  // Estrategia recomendada
  recommendedStrategy: ShareStrategy;
  
  // Descripción para el usuario
  strategyDescription: string;
}

/**
 * 🔍 Hook que detecta las capacidades del navegador actual
 * Optimizado específicamente para Chrome y WhatsApp sharing
 */
export function useBrowserCapabilities(): BrowserCapabilities {
  const [capabilities, setCapabilities] = useState<BrowserCapabilities>(() => 
    detectBrowserCapabilities()
  );

  useEffect(() => {
    // Detectar capacidades al montar
    const detected = detectBrowserCapabilities();
    setCapabilities(detected);
  }, []);

  return capabilities;
}

/**
 * 🎯 Detecta todas las capacidades del navegador actual
 */
function detectBrowserCapabilities(): BrowserCapabilities {
  const userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent;
  
  // Detectar Chrome y su versión
  const isChrome = /Chrome\/(\d+)/.test(userAgent) && !/Edg\//.test(userAgent);
  const chromeRegex = /Chrome\/(\d+)/;
  const chromeMatch = chromeRegex.exec(userAgent);
  const chromeVersion = chromeMatch ? Number.parseInt(chromeMatch[1], 10) : null;
  
  // Detectar móvil
  const isMobile = /Android|iPhone|iPad|iPod/i.test(userAgent);
  
  // Capacidades de Share API
  const hasShareAPI = typeof navigator !== 'undefined' && 'share' in navigator;
  
  let canShareFiles = false;
  let canShareText = false;
  let canShareBoth = false;
  
  if (hasShareAPI && navigator.canShare) {
    try {
      // Crear archivo de prueba
      const testBlob = new Blob(['test'], { type: 'image/png' });
      const testFile = new File([testBlob], 'test.png', { type: 'image/png' });
      
      canShareFiles = navigator.canShare({ files: [testFile] });
      canShareText = navigator.canShare({ text: 'test' });
      canShareBoth = navigator.canShare({ 
        text: 'test', 
        files: [testFile] 
      });
    } catch (error) {
      console.warn('Error detectando capacidades de share:', error);
    }
  }
  
  // Capacidades de Clipboard
  const hasClipboardAPI = typeof navigator !== 'undefined' && 
                          'clipboard' in navigator && 
                          'writeText' in navigator.clipboard;
  
  const canWriteClipboardImages = hasClipboardAPI && 
                                  'write' in navigator.clipboard;
  
  // Determinar estrategia recomendada
  let recommendedStrategy: ShareStrategy;
  let strategyDescription: string;
  
  if (canShareBoth && isChrome && !isMobile) {
    // Chrome Desktop moderno - mejor experiencia
    recommendedStrategy = 'direct';
    strategyDescription = '✨ Envío directo de QR + mensaje';
  } else if (canShareFiles) {
    // Puede compartir archivos pero tal vez no texto
    recommendedStrategy = 'direct';
    strategyDescription = '📤 Envío de QR (mensaje al portapapeles)';
  } else if (canWriteClipboardImages && hasClipboardAPI) {
    // Chrome Desktop sin Share API - usar clipboard
    recommendedStrategy = 'clipboard';
    strategyDescription = '📋 QR y mensaje al portapapeles';
  } else {
    // Fallback - descargar archivo
    recommendedStrategy = 'download';
    strategyDescription = '📥 Descargar QR y copiar mensaje';
  }
  
  return {
    isChrome,
    chromeVersion,
    isMobile,
    hasShareAPI,
    canShareFiles,
    canShareText,
    canShareBoth,
    hasClipboardAPI,
    canWriteClipboardImages,
    recommendedStrategy,
    strategyDescription,
  };
}

/**
 * 🎨 Obtiene un emoji y color para la estrategia
 */
export function getStrategyUI(strategy: ShareStrategy): { emoji: string; color: string; label: string } {
  switch (strategy) {
    case 'direct':
      return { 
        emoji: '✨', 
        color: 'text-green-600', 
        label: 'Compartir Directo' 
      };
    case 'clipboard':
      return { 
        emoji: '📋', 
        color: 'text-blue-600', 
        label: 'Copiar al Portapapeles' 
      };
    case 'download':
      return { 
        emoji: '📥', 
        color: 'text-orange-600', 
        label: 'Descargar Imagen' 
      };
  }
}
