/**
 * Utilidad para optimización de imágenes - Prevenir memory allocation failed
 * Comprime imágenes antes del procesamiento para evitar crashes de memoria
 */

interface CompressedImage {
  blob: Blob;
  dataUrl: string;
  size: number;
  width: number;
  height: number;
}

export class ImageOptimizer {
  private static MAX_WIDTH = 1920;
  private static MAX_HEIGHT = 1080;
  private static QUALITY = 0.85;
  private static MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB después de compresión

  /**
   * Comprime una imagen para reducir el uso de memoria
   */
  static async compressImage(file: File): Promise<CompressedImage> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // Calcular dimensiones optimizadas
          const { width, height } = this.calculateOptimalDimensions(
            img.width, 
            img.height
          );

          canvas.width = width;
          canvas.height = height;

          // Dibujar imagen redimensionada
          ctx!.drawImage(img, 0, 0, width, height);

          // Convertir a blob con compresión
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Error al comprimir imagen'));
                return;
              }

              // Crear data URL para preview
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
                  blob,
                  dataUrl: reader.result as string,
                  size: blob.size,
                  width,
                  height
                });
              };
              reader.readAsDataURL(blob);
            },
            'image/jpeg',
            this.QUALITY
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Error al cargar imagen'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Valida si el archivo necesita compresión
   */
  static needsCompression(file: File): boolean {
    return file.size > this.MAX_FILE_SIZE;
  }

  /**
   * Calcula las dimensiones óptimas manteniendo aspect ratio
   */
  private static calculateOptimalDimensions(
    originalWidth: number, 
    originalHeight: number
  ): { width: number; height: number } {
    let { width, height } = { width: originalWidth, height: originalHeight };

    // Redimensionar si excede los límites
    if (width > this.MAX_WIDTH) {
      height = (height * this.MAX_WIDTH) / width;
      width = this.MAX_WIDTH;
    }

    if (height > this.MAX_HEIGHT) {
      width = (width * this.MAX_HEIGHT) / height;
      height = this.MAX_HEIGHT;
    }

    return {
      width: Math.round(width),
      height: Math.round(height)
    };
  }

  /**
   * Obtiene información del archivo sin cargarlo completamente en memoria
   */
  static getFileInfo(file: File): {
    name: string;
    size: number;
    type: string;
    sizeFormatted: string;
  } {
    const sizeInKB = Math.round(file.size / 1024);
    const sizeInMB = Math.round(file.size / 1024 / 1024 * 100) / 100;
    
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      sizeFormatted: sizeInMB > 1 ? `${sizeInMB}MB` : `${sizeInKB}KB`
    };
  }
}
