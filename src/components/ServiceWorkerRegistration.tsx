'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // Solo ejecutar en el navegador
    if (typeof window === 'undefined') return;
    
    // Verificar soporte de Service Worker
    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️ Service Worker no soportado en este navegador');
      return;
    }

    // Registrar Service Worker
    const registerSW = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
      } catch (error) {
        console.error('❌ Error registrando Service Worker:', error);
      }
    };

    // Escuchar solo evento de instalación completada
    const handleAppInstalled = () => {
      // Limpiar cualquier referencia al prompt
      (window as any).deferredPrompt = null;
    };

    // Registrar cuando la página esté cargada
    if (document.readyState === 'loading') {
      window.addEventListener('load', registerSW);
    } else {
      registerSW();
    }

    // Solo escuchar instalación completada (el beforeinstallprompt lo maneja PWAManager)
    window.addEventListener('appinstalled', handleAppInstalled);

    // Cleanup
    return () => {
      window.removeEventListener('load', registerSW);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  return null;
}
