'use client';

import { useEffect } from 'react';

/**
 * Componente que registra información sobre redirecciones para debugging
 */
export default function RedirectInterceptor() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_REDIRECT_DEBUG !== 'true') {
      return;
    }
    
    // Interceptar fetch calls para monitorear APIs (solo errores críticos)
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      const response = await originalFetch.apply(this, args);
      
      return response;
    };

    // Monitorear cambios en la URL
    let currentUrl = window.location.href;
    const urlMonitor = setInterval(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
      }
    }, 100);

    // Cleanup
    return () => {
      window.fetch = originalFetch;
      clearInterval(urlMonitor);
    };
  }, []);

  return null; // Este componente no renderiza nada
}
