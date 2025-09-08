/**
 * Tipos compartidos para el sistema de branding
 * Extraído de: src/app/admin/page.tsx (líneas 95-110)
 * Evita conflictos entre admin original y admin-v2
 */

export interface SharedBrandingConfig {
  businessName: string;
  primaryColor: string;
  carouselImages?: string[];
}

export interface CarouselImageUploadEvent extends Event {
  target: HTMLInputElement & EventTarget;
}

export type BrandingField = 'businessName' | 'primaryColor' | 'carouselImages';

/**
 * Función helper para validar imagen
 */
export const isValidImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  return validTypes.includes(file.type) && file.size <= maxSize;
};

/**
 * Función helper para convertir archivo a base64
 */
export const convertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Configuración por defecto del branding
 */
export const DEFAULT_BRANDING_CONFIG: SharedBrandingConfig = {
  businessName: 'Mi Empresa',
  primaryColor: '#3B82F6',
  carouselImages: [
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=250&fit=crop',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=250&fit=crop',
    'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=250&fit=crop',
  ],
};
