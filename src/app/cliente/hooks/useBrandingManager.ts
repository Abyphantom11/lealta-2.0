// Hook personalizado para gestión completa de branding - EXTRAÍDO DEL ORIGINAL
import { useState, useEffect } from 'react';

interface BrandingConfig {
  businessName: string;
  primaryColor: string;
  carouselImages: string[];
}

export const useBrandingManager = () => {
  // Estado del branding - EXTRAÍDO DEL ORIGINAL
  const [brandingConfig, setBrandingConfig] = useState<BrandingConfig>(() => {
    // Intentar cargar desde localStorage primero para evitar el flash
    if (typeof window !== 'undefined') {
      try {
        const savedBranding = localStorage.getItem('portalBranding');
        if (savedBranding) {
          const parsed = JSON.parse(savedBranding);
          return {
            businessName: parsed.businessName || 'LEALTA',
            primaryColor: parsed.primaryColor || '#2563EB',
            carouselImages: [] as string[] // Las imágenes se cargarán después desde la API
          };
        }
      } catch (error) {
        console.warn('Error al cargar branding inicial desde localStorage:', error);
      }
    }
    // Fallback por defecto
    return {
      businessName: 'LEALTA',
      primaryColor: '#2563EB',
      carouselImages: [] as string[]
    };
  });

  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Imágenes del carrusel - EXTRAÍDO DEL ORIGINAL
  const carouselImages = brandingConfig.carouselImages?.length > 0 
    ? brandingConfig.carouselImages 
    : [
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=250&fit=crop',
        'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=250&fit=crop',
        'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=250&fit=crop',
        'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=250&fit=crop',
        'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=250&fit=crop',
        'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&h=250&fit=crop'
      ];

  // Función auxiliar para manejar fallback de localStorage - EXTRAÍDA DEL ORIGINAL
  const handleLocalStorageFallback = () => {
    const savedBranding = localStorage.getItem('portalBranding');
    if (savedBranding) {
      try {
        const parsed = JSON.parse(savedBranding);
        setBrandingConfig(parsed);
      } catch (parseError) {
        // Si también falla el parsing de localStorage, mantener configuración por defecto
        console.warn('Error parsing localStorage branding, usando configuración por defecto:', parseError);
        // La configuración por defecto ya está establecida en el estado inicial
      }
    }
    // Siempre quitar el loading después del fallback
    setIsInitialLoading(false);
  };

  // Función para cargar branding desde la API - EXTRAÍDA DEL ORIGINAL
  const loadBranding = async () => {
    try {
      const response = await fetch('/api/branding', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-cache'
      });
      
      if (response.ok) {
        const branding = await response.json();
        console.log('Cliente: Branding cargado desde API:', branding.carouselImages?.length || 0, 'imágenes');
        setBrandingConfig(branding);
        // Guardar versión ligera en localStorage como backup
        try {
          const lightConfig = {
            ...branding,
            carouselImages: branding.carouselImages?.length || 0 // Solo guardar la cantidad
          };
          localStorage.setItem('portalBranding', JSON.stringify(lightConfig));
        } catch (storageError) {
          console.warn('No se pudo guardar branding en localStorage del cliente:', storageError);
        }
      } else {
        // Fallback a localStorage
        const savedBranding = localStorage.getItem('portalBranding');
        if (savedBranding) {
          const parsed = JSON.parse(savedBranding);
          setBrandingConfig(parsed);
        }
      }
    } catch (error) {
      // Si la API falla, usar localStorage como fallback
      console.warn('API branding no disponible, usando localStorage como fallback:', error);
      handleLocalStorageFallback();
    } finally {
      // Quitar el estado de loading después de la primera carga
      setIsInitialLoading(false);
    }
  };

  // Effect para cargar branding - EXTRAÍDO DEL ORIGINAL
  useEffect(() => {
    // Cargar al inicio
    loadBranding();
    // Polling cada 1.5 segundos para detectar cambios más rápido, pero solo después de la carga inicial
    let interval: NodeJS.Timeout;
    setTimeout(() => {
      if (!isInitialLoading) {
        interval = setInterval(() => {
          loadBranding();
        }, 1500);
      }
    }, 1000);
    // Escuchar cambios de localStorage (backup)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'portalBranding' || e.key === 'brandingTrigger') {
        loadBranding();
      }
    };
    // Escuchar eventos personalizados del admin
    const handleBrandingUpdate = (e: CustomEvent) => {
      console.log('Evento de actualización de branding recibido:', e.detail);
      loadBranding();
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('brandingUpdated', handleBrandingUpdate as EventListener);
    // Timeout de seguridad: quitar loading después de 3 segundos máximo
    const safetyTimeout = setTimeout(() => {
      setIsInitialLoading(false);
    }, 3000);
    return () => {
      clearInterval(interval);
      clearTimeout(safetyTimeout);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('brandingUpdated', handleBrandingUpdate as EventListener);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    brandingConfig,
    carouselImages,
    isInitialLoading,
    loadBranding
  };
};
