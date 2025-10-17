/**
 * 🔍 Detector de capacidades de Web Share API
 * 
 * Web Share API tiene soporte fragmentado entre navegadores:
 * - Nivel 1: Solo texto (Android Chrome antiguo, algunos iOS)
 * - Nivel 2: Texto + Archivos (Android Chrome moderno, iOS Safari 15+)
 * - Nivel 3: Título + Texto + Archivos (Android Chrome 89+, iOS Safari 15.4+)
 */

export interface ShareCapabilities {
  canShareText: boolean;
  canShareFiles: boolean;
  canShareBoth: boolean;
  shareLevel: 1 | 2 | 3;
  deviceType: 'mobile' | 'desktop';
  hasClipboard: boolean;
}

/**
 * Detecta las capacidades reales de compartir del dispositivo actual
 */
export function detectShareCapabilities(): ShareCapabilities {
  // Detectar tipo de dispositivo
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  
  // Verificar si tiene clipboard API
  const hasClipboard = !!(navigator.clipboard && navigator.clipboard.writeText);

  // Si no hay Share API, devolver valores por defecto
  if (!navigator.share) {
    return {
      canShareText: false,
      canShareFiles: false,
      canShareBoth: false,
      shareLevel: 1,
      deviceType: isMobile ? 'mobile' : 'desktop',
      hasClipboard,
    };
  }

  try {
    // Crear archivo de prueba pequeño
    const testBlob = new Blob(['test'], { type: 'text/plain' });
    const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });

    // Probar diferentes combinaciones
    const canShareText = navigator.canShare?.({ text: 'test' }) ?? true;
    const canShareFiles = navigator.canShare?.({ files: [testFile] }) ?? false;
    const canShareBoth = navigator.canShare?.({ 
      text: 'test',
      title: 'test',
      files: [testFile] 
    }) ?? false;

    // Determinar nivel de soporte
    let shareLevel: 1 | 2 | 3 = 1;
    if (canShareBoth) {
      shareLevel = 3; // Soporte completo
    } else if (canShareFiles) {
      shareLevel = 2; // Solo archivos
    }

    return {
      canShareText,
      canShareFiles,
      canShareBoth,
      shareLevel,
      deviceType: isMobile ? 'mobile' : 'desktop',
      hasClipboard,
    };
  } catch (error) {
    console.warn('Error detectando capacidades de compartir:', error);
    
    // Fallback seguro
    return {
      canShareText: true,
      canShareFiles: false,
      canShareBoth: false,
      shareLevel: 1,
      deviceType: isMobile ? 'mobile' : 'desktop',
      hasClipboard,
    };
  }
}

/**
 * Obtiene un mensaje descriptivo del nivel de soporte
 */
export function getShareLevelDescription(level: 1 | 2 | 3): string {
  switch (level) {
    case 3:
      return '✨ Compartir directo disponible';
    case 2:
      return '📋 Requiere pegar mensaje';
    case 1:
      return '📥 Descarga + WhatsApp';
    default:
      return '📱 Modo básico';
  }
}

/**
 * Copia texto al portapapeles de forma segura
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // Fallback para navegadores antiguos
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    return success;
  } catch (error) {
    console.error('Error al copiar al portapapeles:', error);
    return false;
  }
}

/**
 * Crea un link de descarga y lo ejecuta
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  
  // Limpiar después de un momento
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Abre WhatsApp con un mensaje pre-llenado
 */
export function openWhatsAppWithMessage(message: string, phoneNumber?: string): void {
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = phoneNumber 
    ? `https://wa.me/${phoneNumber}?text=${encodedMessage}`
    : `https://wa.me/?text=${encodedMessage}`;
  
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
}
