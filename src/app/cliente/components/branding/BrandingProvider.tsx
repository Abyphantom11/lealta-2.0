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
  businessId?: string; // ✅ AGREGAR BUSINESS ID AL CONTEXTO
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
  businessId?: string; // Nuevo prop para business context
}

// Provider del contexto
export const BrandingProvider = ({ children, businessId }: BrandingProviderProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [brandingConfig, setBrandingConfig] = useState<BrandingConfig>(() => {
    // Valores por defecto limpios sin localStorage para evitar contaminación
    return {
      businessName: 'LEALTA',
      primaryColor: '#2563EB',
      secondaryColor: '#7C3AED',
      carouselImages: [] as string[]
    };
  });

  // Función para limpiar localStorage contaminado
  const cleanContaminatedStorage = useCallback(() => {
    try {
      // Limpiar claves de branding contaminadas
      const keysToCheck = ['portalBranding', 'portalBranding_arepa', 'portalBranding_cafedani'];
      keysToCheck.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            // Si contiene datos de prueba como "Holi", limpiar
            if (parsed.businessName === 'Holi' || parsed.businessName === 'holi') {
              localStorage.removeItem(key);
            }
          } catch {
            // Si no se puede parsear, eliminar
            localStorage.removeItem(key);
          }
        }
      });

      // Limpiar configuración de portal contaminada
      const portalKeys = [
        'portalConfig', 
        'portalConfig_default', 
        'portalConfig_arepa',
        ...(businessId ? [`portalConfig_${businessId}`] : [])
      ];
      portalKeys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            // Verificar si hay promociones con datos de prueba "asdadad"
            if (parsed.promociones && Array.isArray(parsed.promociones)) {
              const hasContaminatedPromos = parsed.promociones.some((promo: any) => 
                promo.titulo?.includes('asdadad') || promo.descripcion?.includes('asdadad')
              );
              if (hasContaminatedPromos) {
                localStorage.removeItem(key);
              }
            }
            // Verificar si hay recompensas contaminadas con "fsfsfsf"
            if (parsed.recompensas && Array.isArray(parsed.recompensas)) {
              const hasContaminatedRewards = parsed.recompensas.some((reward: any) => 
                reward.nombre?.includes('fsfsfsf') || reward.descripcion?.includes('fdsfsfsd')
              );
              if (hasContaminatedRewards) {
                localStorage.removeItem(key);
              }
            }
          } catch {
            // Si no se puede parsear, eliminar
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('Error limpiando localStorage:', error);
    }
  }, [businessId]);

  // Carrusel sin imágenes fallback - solo usar las configuradas por el admin
  const carouselImages = useMemo(() => {
    return brandingConfig.carouselImages || [];
  }, [brandingConfig.carouselImages]);

  // Función para cargar branding desde la API
  const loadBranding = useCallback(async () => {
    // Función para validar color hexadecimal
    const isValidHexColor = (color: string): boolean => {
      return typeof color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(color);
    };

    // Función para limpiar y validar datos de branding
    const cleanBrandingData = (branding: any): BrandingConfig => {
      return {
        businessName: branding.businessName?.trim() || 'LEALTA',
        primaryColor: isValidHexColor(branding.primaryColor) ? branding.primaryColor : '#2563EB',
        secondaryColor: isValidHexColor(branding.secondaryColor) ? branding.secondaryColor : '#7C3AED',
        carouselImages: Array.isArray(branding.carouselImages) ? branding.carouselImages : []
      };
    };

    try {
      console.log(`🎨 Cliente - Loading branding for businessId: ${businessId || 'default'}`);
      const url = businessId ? `/api/branding?businessId=${businessId}` : '/api/branding';
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-cache'
      });
      
      if (response.ok) {
        const branding = await response.json();
        
        const cleanBranding = cleanBrandingData(branding);
        setBrandingConfig(cleanBranding);
        
        // Solo guardar en localStorage si los datos no son por defecto
        const isDefaultData = cleanBranding.businessName === 'LEALTA' && 
                              cleanBranding.primaryColor === '#2563EB' && 
                              cleanBranding.carouselImages.length === 0;
        
        if (!isDefaultData) {
          try {
            const storageKey = businessId ? `portalBranding_${businessId}` : 'portalBranding';
            const lightConfig = {
              ...cleanBranding,
              carouselImages: cleanBranding.carouselImages?.length || 0
            };
            localStorage.setItem(storageKey, JSON.stringify(lightConfig));
          } catch (storageError) {
            console.warn('No se pudo guardar branding en localStorage:', storageError);
          }
        }
      } else {
        setBrandingConfig({
          businessName: 'LEALTA',
          primaryColor: '#2563EB',
          secondaryColor: '#7C3AED',
          carouselImages: []
        });
      }
    } catch (error) {
      console.warn('Error cargando branding, usando valores por defecto:', error);
      setBrandingConfig({
        businessName: 'LEALTA',
        primaryColor: '#2563EB',
        secondaryColor: '#7C3AED',
        carouselImages: []
      });
    }
  }, [businessId]);

  // Cargar branding al montar el componente Y cuando cambia businessId
  useEffect(() => {
    // Limpiar localStorage contaminado al inicio
    cleanContaminatedStorage();
    
    // Cargar branding desde API
    loadBranding();
    
    // Polling cada 30 segundos para detectar cambios (reducido de 1.5s para optimizar rendimiento)
    const interval = setInterval(loadBranding, 30000);
    
    // Escuchar cambios de localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'portalBranding' || e.key === 'brandingTrigger') {
        loadBranding();
      }
    };
    
    // Escuchar eventos personalizados del admin
    const handleBrandingUpdate = () => {
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
  }, [loadBranding, cleanContaminatedStorage, businessId]); // ✅ AGREGAR businessId a las dependencias

  // Quitar loading cuando se carga el branding inicial
  useEffect(() => {
    if (brandingConfig.businessName) {
      setIsLoading(false);
    }
  }, [brandingConfig.businessName]);

  const value = useMemo(() => ({
    brandingConfig,
    carouselImages,
    isLoading,
    businessId // ✅ INCLUIR BUSINESS ID EN EL CONTEXTO
  }), [brandingConfig, carouselImages, isLoading, businessId]);

  return (
    <BrandingContext.Provider value={value}>
      {children}
    </BrandingContext.Provider>
  );
};
