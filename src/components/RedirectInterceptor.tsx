'use client';

import { useEffect } from 'react';

/**
 * Componente que registra información sobre redirecciones para debugging
 */
export default function RedirectInterceptor() {
  useEffect(() => {
    // console.log('🛡️ RedirectInterceptor activado');
    
    // Interceptar fetch calls para monitorear APIs
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      const [url, options] = args;
      console.log('📡 FETCH interceptado:', {
        url: url.toString(),
        method: options?.method || 'GET'
      });
      
      const response = await originalFetch.apply(this, args);
      
      console.log('📡 FETCH respuesta:', {
        url: url.toString(),
        status: response.status,
        ok: response.ok
      });
      
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
      console.log('🛡️ RedirectInterceptor desactivado');
    };
  }, []);

  return null; // Este componente no renderiza nada
}
