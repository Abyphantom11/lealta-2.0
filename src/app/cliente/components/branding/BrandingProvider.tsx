'use client';
import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';

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
      businessName: 'Mi Negocio',
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      carouselImages: [] as string[]
    };
  });

  // Función para limpiar localStorage contaminado
  const cleanContaminatedStorage = () => {
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
    } catch (error) {
      console.warn('Error limpiando localStorage:', error);
    }
  };

  // 🔥 FUNCIÓN PARA CARGA INMEDIATA DESDE LOCALSTORAGE
  const loadFromLocalStorage = () => {
    try {
      const storageKey = businessId ? `portalBranding_${businessId}` : 'portalBranding';
      const storedBranding = localStorage.getItem(storageKey);
      
      if (storedBranding) {
        const parsed = JSON.parse(storedBranding);
        const cleanBranding = {
          businessName: parsed.businessName?.trim() || 'Mi Negocio',
          primaryColor: parsed.primaryColor || '#3B82F6',
          secondaryColor: parsed.secondaryColor || '#1E40AF',
          carouselImages: Array.isArray(parsed.carouselImages) ? parsed.carouselImages : []
        };
        setBrandingConfig(cleanBranding);
        return true;
      }
    } catch (error) {
      console.warn('⚠️ Cliente - Error leyendo localStorage:', error);
    }
    return false;
  };

  // Función para cargar branding desde la API
  const loadBranding = async () => {
    // Función para validar color hexadecimal
    const isValidHexColor = (color: string): boolean => {
      return typeof color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(color);
    };

    // Función para limpiar y validar datos de branding
    const cleanBrandingData = (branding: any): BrandingConfig => {
      return {
        businessName: branding.businessName?.trim() || 'Mi Negocio',
        primaryColor: isValidHexColor(branding.primaryColor) ? branding.primaryColor : '#3B82F6',
        secondaryColor: isValidHexColor(branding.secondaryColor) ? branding.secondaryColor : '#1E40AF',
        carouselImages: Array.isArray(branding.carouselImages) ? branding.carouselImages : []
      };
    };

    try {
      const url = businessId ? `/api/branding?businessId=${businessId}` : '/api/branding';
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        cache: 'no-store'
      });
      
      if (response.ok) {
        const branding = await response.json();
        const cleanBranding = cleanBrandingData(branding);
        setBrandingConfig(cleanBranding);
        
        // Guardar en localStorage
        try {
          const storageKey = businessId ? `portalBranding_${businessId}` : 'portalBranding';
          localStorage.setItem(storageKey, JSON.stringify(cleanBranding));
        } catch (storageError) {
          console.warn('No se pudo guardar branding en localStorage:', storageError);
        }
      }
    } catch (error) {
      console.warn('Error cargando branding:', error);
    }
  };

  // Cargar branding al montar el componente Y cuando cambia businessId
  useEffect(() => {
    // Cargar desde localStorage
    loadFromLocalStorage();
    
    // Limpiar localStorage contaminado al inicio
    cleanContaminatedStorage();
    
    // Cargar branding desde API
    loadBranding();
    
  }, []); // Sin dependencias para evitar loops infinitos

  // Quitar loading cuando se carga el branding inicial - OPTIMIZADO
  useEffect(() => {
    // Siempre quitar loading después de la carga inicial (ya tenemos valores por defecto)
    setIsLoading(false);
  }, []); // Solo ejecutar una vez

  const value = useMemo(() => ({
    brandingConfig,
    carouselImages: brandingConfig.carouselImages || [],
    isLoading,
    businessId // ✅ INCLUIR BUSINESS ID EN EL CONTEXTO
  }), [brandingConfig, isLoading, businessId]);

  return (
    <BrandingContext.Provider value={value}>
      {children}
    </BrandingContext.Provider>
  );
};
