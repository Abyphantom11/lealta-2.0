'use client';
import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';

// Interfaz para la configuración de branding
interface BrandingConfig {
  businessName: string;
  primaryColor: string;
  secondaryColor: string;
  carouselImages: string[];
}

// Interfaz del contexto
interface BrandingContextType {
  brandingConfig: BrandingConfig;
  carouselImages: string[];
  isLoading: boolean;
}

// Crear el contexto
const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

// Hook para usar el contexto
export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding debe ser usado dentro de un BrandingProvider');
  }
  return context;
};

// Props del provider
interface BrandingProviderProps {
  children: ReactNode;
}

// Provider del contexto
export const BrandingProvider = ({ children }: BrandingProviderProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [brandingConfig, setBrandingConfig] = useState<BrandingConfig>(() => {
    // Intentar cargar desde localStorage primero para evitar el flash
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('portalBranding');
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            businessName: parsed.businessName || 'LEALTA',
            primaryColor: parsed.primaryColor || '#2563EB',
            secondaryColor: parsed.secondaryColor || '#7C3AED',
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
      secondaryColor: '#7C3AED',
      carouselImages: [] as string[]
    };
  });

  // Carrusel con fallback
  const carouselImages = useMemo(() => {
    return brandingConfig.carouselImages?.length > 0 
      ? brandingConfig.carouselImages 
      : [
          'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=250&fit=crop',
          'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=250&fit=crop',
          'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=250&fit=crop',
          'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=250&fit=crop',
          'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=250&fit=crop',
          'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&h=250&fit=crop'
        ];
  }, [brandingConfig.carouselImages]);

  // Función auxiliar para manejar fallback de localStorage
  const handleLocalStorageFallback = useCallback(() => {
    const savedBranding = localStorage.getItem('portalBranding');
    if (savedBranding) {
      try {
        const parsed = JSON.parse(savedBranding);
        setBrandingConfig(prev => ({
          ...prev,
          ...parsed
        }));
      } catch (parseError) {
        console.warn('Error parsing localStorage branding, usando configuración por defecto:', parseError);
      }
    }
  }, []);

  // Función para cargar branding desde la API
  const loadBranding = useCallback(async () => {
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
        handleLocalStorageFallback();
      }
    } catch (error) {
      console.warn('API branding no disponible, usando localStorage como fallback:', error);
      handleLocalStorageFallback();
    }
  }, [handleLocalStorageFallback]);

  // Cargar branding al montar el componente
  useEffect(() => {
    loadBranding();
    
    // Polling cada 1.5 segundos para detectar cambios
    const interval = setInterval(loadBranding, 1500);
    
    // Escuchar cambios de localStorage
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
      setIsLoading(false);
    }, 3000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(safetyTimeout);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('brandingUpdated', handleBrandingUpdate as EventListener);
    };
  }, [loadBranding]);

  // Quitar loading cuando se carga el branding inicial
  useEffect(() => {
    if (brandingConfig.businessName) {
      setIsLoading(false);
    }
  }, [brandingConfig.businessName]);

  const value = useMemo(() => ({
    brandingConfig,
    carouselImages,
    isLoading
  }), [brandingConfig, carouselImages, isLoading]);

  return (
    <BrandingContext.Provider value={value}>
      {children}
    </BrandingContext.Provider>
  );
};
