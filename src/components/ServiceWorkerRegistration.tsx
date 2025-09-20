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
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        console.log('✅ Service Worker registrado:', registration.scope);
      } catch (error) {
        console.error('❌ Error registrando Service Worker:', error);
      }
    };

    // Escuchar evento de instalación PWA
    const handleBeforeInstall = (e: Event) => {
      console.log('📱 PWA se puede instalar');
      e.preventDefault();
      
      // Guardar el evento para uso posterior
      (window as any).deferredPrompt = e;
      
      // Disparar evento personalizado
      window.dispatchEvent(new CustomEvent('pwa-installable'));
    };

    const handleAppInstalled = () => {
      console.log('✅ PWA instalada exitosamente');
      (window as any).deferredPrompt = null;
    };

    // Registrar cuando la página esté cargada
    if (document.readyState === 'loading') {
      window.addEventListener('load', registerSW);
    } else {
      registerSW();
    }

    // Agregar listeners de PWA
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Cleanup
    return () => {
      window.removeEventListener('load', registerSW);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  return null;
}
