import { useCallback, useRef, useState } from 'react';
import html2canvas from 'html2canvas';

export interface QRGenerationOptions {
  scale?: number;
  quality?: number;
}

export interface QRGenerationResult {
  blob: Blob | null;
  dataUrl: string | null;
  error: Error | null;
  isGenerating: boolean;
}

/**
 * 🎨 Hook optimizado para generar imágenes de QR con cache inteligente
 */
export function useQRGeneration() {
  const [result, setResult] = useState<QRGenerationResult>({
    blob: null,
    dataUrl: null,
    error: null,
    isGenerating: false,
  });

  // Cache del último elemento generado para evitar regeneraciones innecesarias
  const cacheRef = useRef<{
    element: HTMLElement | null;
    blob: Blob | null;
    dataUrl: string | null;
  }>({
    element: null,
    blob: null,
    dataUrl: null,
  });

  /**
   * 📸 Genera la imagen del QR desde un elemento HTML
   */
  const generateQR = useCallback(async (
    element: HTMLElement,
    options: QRGenerationOptions = {}
  ): Promise<Blob | null> => {
    // Si ya tenemos cache del mismo elemento, devolverlo
    if (cacheRef.current.element === element && cacheRef.current.blob) {
      console.log('✅ Usando QR cacheado');
      return cacheRef.current.blob;
    }

    setResult(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      // Configuración optimizada de html2canvas
      const canvas = await html2canvas(element, {
        backgroundColor: null,
        scale: options.scale || 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        foreignObjectRendering: false,
        removeContainer: true,
        width: element.scrollWidth,
        height: element.scrollHeight,
        scrollX: 0,
        scrollY: 0,
      });

      // Convertir a Blob con calidad específica
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(
          (result) => resolve(result),
          'image/png',
          options.quality || 1
        );
      });

      if (!blob) {
        throw new Error('No se pudo generar el blob');
      }

      // Crear Data URL para preview si es necesario
      const dataUrl = URL.createObjectURL(blob);

      // Guardar en cache
      cacheRef.current = {
        element,
        blob,
        dataUrl,
      };

      setResult({
        blob,
        dataUrl,
        error: null,
        isGenerating: false,
      });

      console.log('✅ QR generado exitosamente:', {
        size: `${(blob.size / 1024).toFixed(2)} KB`,
        dimensions: `${canvas.width}x${canvas.height}`,
      });

      return blob;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Error desconocido');
      console.error('❌ Error generando QR:', err);
      
      setResult({
        blob: null,
        dataUrl: null,
        error: err,
        isGenerating: false,
      });

      return null;
    }
  }, []);

  /**
   * 🗑️ Limpia el cache y libera memoria
   */
  const clearCache = useCallback(() => {
    if (cacheRef.current.dataUrl) {
      URL.revokeObjectURL(cacheRef.current.dataUrl);
    }
    
    cacheRef.current = {
      element: null,
      blob: null,
      dataUrl: null,
    };

    setResult({
      blob: null,
      dataUrl: null,
      error: null,
      isGenerating: false,
    });
  }, []);

  /**
   * 📥 Descarga el QR generado
   */
  const downloadQR = useCallback((fileName: string = 'qr-code.png') => {
    const { blob } = cacheRef.current;
    
    if (!blob) {
      console.error('No hay QR generado para descargar');
      return false;
    }

    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        link.remove();
        URL.revokeObjectURL(url);
      }, 100);

      return true;
    } catch (error) {
      console.error('Error descargando QR:', error);
      return false;
    }
  }, []);

  return {
    generateQR,
    clearCache,
    downloadQR,
    result,
  };
}
