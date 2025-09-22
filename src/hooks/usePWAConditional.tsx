'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

// Rutas donde NO se debe mostrar el prompt de instalación PWA
const EXCLUDED_ROUTES = [
  '/', 
  '/signup',
  '/superadmin',  // Excluir superadmin
];

// Patrones de rutas que también deben excluirse (rutas dinámicas)
const EXCLUDED_PATTERNS = [
  /^\/[^/]+\/admin$/,      // /[businessId]/admin
  /^\/[^/]+\/staff$/,      // /[businessId]/staff  
];

// Rutas donde SÍ se debe mostrar el BOTÓN de instalación PWA (más restrictivo)
const BUTTON_ALLOWED_ROUTES = ['/login'];

/**
 * Hook personalizado para determinar si se debe mostrar el prompt PWA
 * basado en la ruta actual
 */
export function usePWAConditional() {
  const pathname = usePathname();
  const [shouldShowPWA, setShouldShowPWA] = useState(false);

  useEffect(() => {
    const isExcluded = EXCLUDED_ROUTES.includes(pathname) || 
                      EXCLUDED_PATTERNS.some(pattern => pattern.test(pathname));
    setShouldShowPWA(!isExcluded);
    
    // Debug log para desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔧 PWA Conditional: ${pathname} → ${!isExcluded ? 'MOSTRAR' : 'OCULTAR'} PWA`);
    }
  }, [pathname]);

  return shouldShowPWA;
}

/**
 * Función para verificar si una ruta específica debe mostrar PWA
 * Útil para uso directo sin hook
 */
export function shouldShowPWAForRoute(pathname: string): boolean {
  return !EXCLUDED_ROUTES.includes(pathname) && 
         !EXCLUDED_PATTERNS.some(pattern => pattern.test(pathname));
}

/**
 * Función específica para verificar si debe mostrarse el BOTÓN de instalación PWA
 * Más restrictivo que el popup - solo en login
 */
export function shouldShowPWAButtonForRoute(pathname: string): boolean {
  return BUTTON_ALLOWED_ROUTES.includes(pathname);
}

/**
 * Función para agregar rutas a la lista de exclusión
 * Útil para configuración dinámica
 */
export function addExcludedRoute(route: string) {
  if (!EXCLUDED_ROUTES.includes(route)) {
    EXCLUDED_ROUTES.push(route);
  }
}

/**
 * Función para obtener las rutas excluidas actuales
 */
export function getExcludedRoutes(): readonly string[] {
  return EXCLUDED_ROUTES as readonly string[];
}
