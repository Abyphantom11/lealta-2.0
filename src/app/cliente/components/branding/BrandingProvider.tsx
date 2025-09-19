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
  const [isLoading, setIsLoading] = useState(false); // 🔥 CAMBIAR A FALSE para no bloquear
  const [brandingConfig, setBrandingConfig] = useState<BrandingConfig>(() => {
    // 🔥 USAR valores por defecto inmediatamente para evitar delay visual
    return {
      businessName: 'Mi Empresa',
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
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

  // 🔥 FUNCIÓN PARA CARGA INMEDIATA DESDE LOCALSTORAGE
  const loadFromLocalStorage = useCallback(() => {
    try {
      const storageKey = businessId ? `portalBranding_${businessId}` : 'portalBranding';
      const storedBranding = localStorage.getItem(storageKey);
      
      if (storedBranding) {
        const parsed = JSON.parse(storedBranding);
        const cleanBranding = {
          businessName: parsed.businessName?.trim() || 'Mi Empresa',
          primaryColor: parsed.primaryColor || '#3B82F6',
          secondaryColor: parsed.secondaryColor || '#1E40AF',
          carouselImages: Array.isArray(parsed.carouselImages) ? parsed.carouselImages : []
        };
        setBrandingConfig(cleanBranding);
        // console.log('🚀 Cliente - Branding cargado instantáneamente desde localStorage:', cleanBranding);
        return true;
      }
    } catch (error) {
      console.warn('⚠️ Cliente - Error leyendo localStorage:', error);
    }
    return false;
  }, [businessId]);

  // Función para cargar branding desde la API
  const loadBranding = useCallback(async () => {
    // NO limpiar localStorage automáticamente - causa pérdida de datos
    // Solo limpiar si hay algún indicador específico de que los datos están obsoletos
    
    // console.log('🧹 Cliente - Manteniendo localStorage cache para consistencia');
    // console.log('🔥 CRITICAL DEBUG - BusinessId in loadBranding:', {
    //   businessId,
    //   type: typeof businessId,
    //   exists: !!businessId,
    //   value: businessId
    // });

    // Función para validar color hexadecimal
    const isValidHexColor = (color: string): boolean => {
      return typeof color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(color);
    };

    // Función para limpiar y validar datos de branding
    const cleanBrandingData = (branding: any): BrandingConfig => {
      return {
        businessName: branding.businessName?.trim() || 'Mi Empresa',
        primaryColor: isValidHexColor(branding.primaryColor) ? branding.primaryColor : '#3B82F6',
        secondaryColor: isValidHexColor(branding.secondaryColor) ? branding.secondaryColor : '#1E40AF',
        carouselImages: Array.isArray(branding.carouselImages) ? branding.carouselImages : []
      };
    };

    try {
      // console.log(`🎨 Cliente - Loading branding for businessId: ${businessId || 'default'}`);
      // console.log('🎨 Cliente - BusinessId type:', typeof businessId, 'Value:', businessId);
      
      const url = businessId ? `/api/branding?businessId=${businessId}` : '/api/branding';
      // console.log('🎨 Cliente - Making request to:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        cache: 'no-store' // Forzar no cache
      });
      
      // console.log('🎨 Cliente - Response status:', response.status);
      
      if (response.ok) {
        const branding = await response.json();
        // console.log('🎨 Cliente - Branding data received:', branding);
        
        const cleanBranding = cleanBrandingData(branding);
        // console.log('🎨 Cliente - Clean branding data:', cleanBranding);
        setBrandingConfig(cleanBranding);
        
        // Solo guardar en localStorage si los datos son válidos
        const hasValidData = cleanBranding.businessName || 
                           cleanBranding.primaryColor || 
                           cleanBranding.carouselImages.length > 0;
        
        if (hasValidData) {
          try {
            const storageKey = businessId ? `portalBranding_${businessId}` : 'portalBranding';
            // 🔥 GUARDAR IMÁGENES COMPLETAS, no solo el count
            localStorage.setItem(storageKey, JSON.stringify(cleanBranding));
          } catch (storageError) {
            console.warn('No se pudo guardar branding en localStorage:', storageError);
          }
        }
      } else {
        // Si la respuesta no es OK, mantener estado de carga hasta obtener datos válidos
        console.warn('🔥 Response not OK, manteniendo loading state');
      }
    } catch (error) {
      console.warn('Error cargando branding, manteniendo loading state:', error);
    }
  }, [businessId]);

  // Cargar branding al montar el componente Y cuando cambia businessId
  useEffect(() => {
    // 🔥 PRIMERA PRIORIDAD: Cargar inmediatamente desde localStorage
    const hasLocalData = loadFromLocalStorage();
    
    // Limpiar localStorage contaminado al inicio
    cleanContaminatedStorage();
    
    // Cargar branding desde API solo si no hay datos locales o de forma asíncrona
    if (!hasLocalData) {
      loadBranding();
    } else {
      // Si hay datos locales, aún cargar desde API pero sin bloquear
      setTimeout(() => loadBranding(), 100);
    }
    
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
    
    // Timeout de seguridad: quitar loading después de 500ms máximo (reducido de 3s)
    const safetyTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => {
      clearInterval(interval);
      clearTimeout(safetyTimeout);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('brandingUpdated', handleBrandingUpdate as EventListener);
    };
  }, [loadBranding, cleanContaminatedStorage, loadFromLocalStorage, businessId]); // ✅ AGREGAR businessId a las dependencias

  // Quitar loading cuando se carga el branding inicial - OPTIMIZADO
  useEffect(() => {
    // Siempre quitar loading después de la carga inicial (ya tenemos valores por defecto)
    setIsLoading(false);
  }, []); // Solo ejecutar una vez

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
