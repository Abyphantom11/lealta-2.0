import { ShareStrategy } from '@/hooks/useBrowserCapabilities';

export interface ShareOptions {
  file: File;
  message: string;
  hasCustomMessage: boolean;
}

export interface ShareResult {
  success: boolean;
  strategy: ShareStrategy;
  message: string;
  description?: string;
}

/**
 * 🎯 Ejecuta la estrategia de compartir recomendada
 */
export async function executeShareStrategy(
  strategy: ShareStrategy,
  options: ShareOptions
): Promise<ShareResult> {
  switch (strategy) {
    case 'direct':
      return await shareDirect(options);
    
    case 'clipboard':
      return await shareViaClipboard(options);
    
    case 'download':
      return await shareViaDownload(options);
    
    default:
      return {
        success: false,
        strategy: 'download',
        message: '❌ Estrategia no soportada',
      };
  }
}

/**
 * ✨ ESTRATEGIA DIRECTA - Share API con archivos + texto
 */
async function shareDirect(options: ShareOptions): Promise<ShareResult> {
  const { file, message, hasCustomMessage } = options;

  try {
    // Detectar si es móvil
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    // IMPORTANTE: En móviles, SIEMPRE copiar el mensaje al portapapeles primero
    // porque muchas apps (WhatsApp, Telegram, etc) ignoran el texto del Share API
    if (hasCustomMessage && isMobile) {
      try {
        await navigator.clipboard.writeText(message);
        console.log('📋 Mensaje copiado al portapapeles (móvil)');
      } catch (error) {
        console.warn('⚠️ No se pudo copiar mensaje al portapapeles:', error);
      }
    }

    // Intentar compartir con archivos + texto (aunque el texto probablemente sea ignorado en móviles)
    if (hasCustomMessage && navigator.canShare?.({ text: message, files: [file] })) {
      console.log('🥇 Estrategia: Share API con texto + archivo juntos');
      
      await navigator.share({
        text: message,
        files: [file],
      });

      return {
        success: true,
        strategy: 'direct',
        message: '✅ QR enviado',
        description: isMobile 
          ? '📋 Mensaje copiado - Pégalo manualmente en el chat de WhatsApp'
          : '🏆 Imagen y mensaje enviados juntos correctamente',
      };
    }

    // Intentar solo archivos
    if (navigator.canShare?.({ files: [file] })) {
      console.log('🥈 Estrategia: Share API solo con archivo');
      
      await navigator.share({
        files: [file],
      });

      // Si hay mensaje personalizado, copiarlo al portapapeles
      if (hasCustomMessage) {
        try {
          await navigator.clipboard.writeText(message);
          console.log('📋 Mensaje copiado al portapapeles');
        } catch (error) {
          console.warn('No se pudo copiar mensaje al portapapeles:', error);
        }

        return {
          success: true,
          strategy: 'direct',
          message: '✅ QR enviado',
          description: '📋 Mensaje copiado - Pégalo en WhatsApp',
        };
      }

      return {
        success: true,
        strategy: 'direct',
        message: '✅ QR enviado correctamente',
        description: '📷 Imagen compartida exitosamente',
      };
    }

    // Si llegamos aquí, no se puede compartir archivos
    throw new Error('No se puede compartir archivos');
  } catch (error: any) {
    // Si el usuario canceló, no es un error
    if (error.name === 'AbortError') {
      return {
        success: false,
        strategy: 'direct',
        message: 'Compartir cancelado',
      };
    }

    console.warn('Share API falló:', error);
    
    // Fallback a clipboard
    return await shareViaClipboard(options);
  }
}

/**
 * 📋 ESTRATEGIA CLIPBOARD - Copiar imagen y mensaje al portapapeles
 */
async function shareViaClipboard(options: ShareOptions): Promise<ShareResult> {
  const { file, message, hasCustomMessage } = options;

  try {
    console.log('📋 Estrategia: Clipboard API');

    // Convertir File a Blob
    const blob = new Blob([await file.arrayBuffer()], { type: file.type });
    
    let imageCopiada = false;

    // Intentar copiar imagen al portapapeles
    if (navigator.clipboard && 'write' in navigator.clipboard) {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        imageCopiada = true;
        console.log('✅ Imagen copiada al portapapeles');
      } catch (error) {
        console.warn('No se pudo copiar imagen:', error);
      }
    }

    // Copiar mensaje si existe
    if (hasCustomMessage) {
      try {
        await navigator.clipboard.writeText(message);
        console.log('✅ Mensaje copiado al portapapeles');
      } catch (error) {
        console.warn('No se pudo copiar mensaje:', error);
      }
    }

    if (imageCopiada) {
      return {
        success: true,
        strategy: 'clipboard',
        message: '📋 QR y mensaje copiados',
        description: hasCustomMessage
          ? 'Imagen + mensaje en portapapeles (Ctrl+V en WhatsApp)'
          : 'Imagen lista en portapapeles (Ctrl+V)',
      };
    } else {
      // Si no se pudo copiar imagen, descargar
      return await shareViaDownload(options);
    }
  } catch (error) {
    console.error('Error en clipboard:', error);
    return await shareViaDownload(options);
  }
}

/**
 * 📥 ESTRATEGIA DOWNLOAD - Descargar archivo
 */
async function shareViaDownload(options: ShareOptions): Promise<ShareResult> {
  const { file, message, hasCustomMessage } = options;

  try {
    console.log('📥 Estrategia: Descargar archivo');

    // Descargar imagen
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    setTimeout(() => {
      link.remove();
      URL.revokeObjectURL(url);
    }, 100);

    // Copiar mensaje si existe
    if (hasCustomMessage) {
      try {
        await navigator.clipboard.writeText(message);
      } catch (error) {
        console.warn('No se pudo copiar mensaje:', error);
      }

      return {
        success: true,
        strategy: 'download',
        message: '📥 QR descargado',
        description: 'Mensaje copiado - Adjunta el archivo en WhatsApp',
      };
    }

    return {
      success: true,
      strategy: 'download',
      message: '📥 QR descargado',
      description: 'Adjunta el archivo manualmente en WhatsApp',
    };
  } catch (error) {
    console.error('Error descargando:', error);
    
    return {
      success: false,
      strategy: 'download',
      message: '❌ Error al descargar',
      description: 'No se pudo descargar el archivo',
    };
  }
}

/**
 * 🌐 Abre WhatsApp Web con el número y mensaje (opcional)
 */
export function openWhatsAppWeb(phoneNumber?: string, message?: string): void {
  let url = 'https://wa.me/';
  
  if (phoneNumber) {
    // Limpiar número de teléfono
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    url += cleanPhone;
    
    if (message) {
      url += `?text=${encodeURIComponent(message)}`;
    }
  }
  
  window.open(url, '_blank');
}

/**
 * 📋 Copia texto al portapapeles de forma segura
 */
export async function copyToClipboardSafe(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
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
    textArea.remove();
    
    return success;
  } catch (error) {
    console.error('Error al copiar:', error);
    return false;
  }
}
