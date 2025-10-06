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
      const [url, options] = args;
      
      const response = await originalFetch.apply(this, args);
      
      // Solo logear errores no esperados (no 401 para /api/auth/me)
      if (!response.ok && !(response.status === 401 && url.toString().includes('/api/auth/me'))) {
        console.log('📡 FETCH error:', {
          url: url.toString(),
          status: response.status,
          method: options?.method || 'GET'
        });
      }
      
      return response;
    };

    // Monitorear cambios en la URL
    let currentUrl = window.location.href;
    const urlMonitor = setInterval(() => {
      if (window.location.href !== currentUrl) {
        console.log('🌐 URL cambió:', {
          from: currentUrl,
          to: window.location.href
        });
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
