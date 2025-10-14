// src/hooks/useBusiness.ts
'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export interface BusinessContext {
  businessId: string;
  subdomain: string;
  businessName: string;
  isLoading: boolean;
  error?: string;
}

/**
 * Hook para obtener el contexto del business desde la URL
 * Extrae el subdomain de rutas como /cafedani/admin
 */
export function useBusiness(): BusinessContext | null {
  const pathname = usePathname();
  const [businessContext, setBusinessContext] = useState<BusinessContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBusinessContext() {
      try {
        setIsLoading(true);
        
        // Extraer subdomain del pathname
        const pathSegments = pathname.split('/').filter(Boolean);
        
        if (pathSegments.length === 0) {
          setBusinessContext(null);
          setIsLoading(false);
          return;
        }

        const potentialSubdomain = pathSegments[0];
        
        // Verificar que no sea una ruta pública
        const publicRoutes = ['login', 'signup', 'api', '_next'];
        if (publicRoutes.includes(potentialSubdomain)) {
          setBusinessContext(null);
          setIsLoading(false);
          return;
        }

        // Cargar información del business
        const response = await fetch(`/api/business/info?subdomain=${potentialSubdomain}`);
        
        if (!response.ok) {
          setBusinessContext(null);
          setIsLoading(false);
          return;
        }

        const businessData = await response.json();
        
        setBusinessContext({
          businessId: businessData.id,
          subdomain: businessData.subdomain,
          businessName: businessData.name,
          isLoading: false
        });
        
      } catch (error) {
        console.error('Error loading business context:', error);
        setBusinessContext(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadBusinessContext();
  }, [pathname]);

  return businessContext || { 
    businessId: '', 
    subdomain: '', 
    businessName: '', 
    isLoading 
  };
}

/**
 * Hook para navegación dentro del contexto del business
 */
export function useBusinessNavigation() {
  const businessContext = useBusiness();
  
  const getBusinessUrl = (path: string): string => {
    if (!businessContext) {
      return path;
    }
    
    // Asegurar que el path empiece con /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    
    return `/${businessContext.subdomain}${cleanPath}`;
  };

  const isInBusinessContext = (): boolean => {
    return businessContext !== null;
  };

  return {
    getBusinessUrl,
    isInBusinessContext,
    businessContext
  };
}
