import { useEffect } from 'react';

/**
 * Utilidad para limpiar cache obsoleto de banners
 * Ejecutar cuando aparezcan banners que deberían estar eliminados
 */

export const clearObsoleteBannerCache = (businessId?: string) => {
  if (typeof window === 'undefined') return;

  console.log('🧹 Limpiando cache obsoleto de banners...');

  try {
    // Limpiar localStorage relacionado con portal
    const keysToCheck = Object.keys(localStorage).filter(key => 
      key.includes('portal') || 
      key.includes('branding') || 
      key.includes('config')
    );

    keysToCheck.forEach(key => {
      try {
        localStorage.removeItem(key);
        console.log(`✅ Eliminado: ${key}`);
      } catch (error) {
        console.warn(`❌ Error eliminando ${key}:`, error);
      }
    });

    // Si hay businessId específico, limpiar claves específicas
    if (businessId) {
      const specificKeys = [
        `portalConfig_${businessId}`,
        `portalBranding_${businessId}`,
        `banners_${businessId}`,
        `config_${businessId}`
      ];

      specificKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
          console.log(`✅ Eliminado específico: ${key}`);
        } catch (error) {
          console.warn(`❌ Error eliminando ${key}:`, error);
        }
      });
    }

    // Limpiar cache del navegador para APIs
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          if (cacheName.includes('portal') || cacheName.includes('api')) {
            caches.delete(cacheName).then(() => {
              console.log(`✅ Cache del navegador eliminado: ${cacheName}`);
            });
          }
        });
      });
    }

    console.log('✅ Cache de banners limpiado completamente');
    
    // Sugerir recarga
    console.log('💡 Se recomienda recargar la página para ver los cambios');

  } catch (error) {
    console.error('❌ Error limpiando cache de banners:', error);
  }
};

// Función para limpiar automáticamente al detectar banners fantasma
export const detectAndCleanGhostBanners = (banners: any[], businessId?: string) => {
  // Patrones de banners que podrían ser fantasma (personalizar según necesidad)
  const ghostPatterns = [
    'agua de grifo',
    'agua grifo',
    '200 pts',
    '200pts',
    'love me sky'
  ];

  const hasGhostBanners = banners.some(banner => 
    ghostPatterns.some(pattern => 
      banner.titulo?.toLowerCase().includes(pattern) ||
      banner.descripcion?.toLowerCase().includes(pattern)
    )
  );

  if (hasGhostBanners) {
    console.warn('🚨 Detectados posibles banners fantasma:', banners);
    console.log('🧹 Limpiando cache automáticamente...');
    clearObsoleteBannerCache(businessId);
    
    return true; // Indica que se encontraron y limpiaron banners fantasma
  }

  return false;
};

// Hook para detectar banners fantasma automáticamente
export const useGhostBannerDetection = (banners: any[], businessId?: string) => {
  // Detectar al montar o cuando cambien los banners
  useEffect(() => {
    if (typeof globalThis.window === 'undefined') return;
    
    if (banners.length > 0) {
      detectAndCleanGhostBanners(banners, businessId);
    }
  }, [banners, businessId]);
};

// Exponer funciones globalmente para debug en consola
if (typeof window !== 'undefined') {
  (window as any).clearBannerCache = clearObsoleteBannerCache;
  (window as any).detectGhostBanners = detectAndCleanGhostBanners;
}
