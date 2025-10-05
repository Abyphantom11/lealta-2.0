'use client';

import { useState, useEffect } from 'react';

/**
 * Hook para detectar media queries
 * Útil para responsive design y renderizado condicional
 * 
 * @param query - Media query string (ej: '(max-width: 768px)')
 * @returns boolean - true si la media query coincide
 * 
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * return isMobile ? <MobileView /> : <DesktopView />;
 */
export function useMediaQuery(query: string): boolean {
  // Estado inicial basado en matchMedia (evita flash)
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);
    
    // Actualizar estado si cambió
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    // Listener para cambios (ej: rotación de pantalla)
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // addEventListener es el método moderno
    media.addEventListener('change', listener);
    
    // Cleanup
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

/**
 * Breakpoints comunes pre-configurados
 */
export const useBreakpoints = () => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isLargeDesktop = useMediaQuery('(min-width: 1280px)');

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    // Helpers
    isMobileOrTablet: isMobile || isTablet,
    isTabletOrDesktop: isTablet || isDesktop,
  };
};
