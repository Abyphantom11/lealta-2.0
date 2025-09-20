'use client';

import { useEffect } from 'react';

interface UseDynamicManifestProps {
  businessSlug?: string;
}

export function useDynamicManifest({ businessSlug }: UseDynamicManifestProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Función para configurar el manifest
    const setupManifest = () => {
      // Buscar manifest link existente
      let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
      
      if (!manifestLink) {
        // Crear nuevo manifest link si no existe
        manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        document.head.appendChild(manifestLink);
      }

      // Actualizar href del manifest
      if (businessSlug) {
        const manifestUrl = `/api/manifest?business=${encodeURIComponent(businessSlug)}`;
        manifestLink.href = manifestUrl;
        console.log('🔧 Manifest dinámico configurado para:', businessSlug);
        console.log('🔧 Manifest URL:', manifestUrl);
        console.log('🔧 Start URL será:', `/${businessSlug}/cliente`);
      } else {
        // Usar manifest genérico
        manifestLink.href = '/api/manifest';
        console.log('🔧 Manifest genérico configurado');
      }

      // Forzar que el navegador recharge el manifest
      manifestLink.setAttribute('data-timestamp', Date.now().toString());
    };

    // Configurar inmediatamente
    setupManifest();

    // También configurar cuando el DOM esté completamente listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupManifest);
    }

    // Forzar actualización del service worker y PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        console.log('🔧 Service Worker listo para manifest dinámico');
        // Disparar evento para que PWA detecte cambios
        window.dispatchEvent(new Event('manifestchange'));
        
        // Forzar recarga del manifest en el SW
        if (registration.active) {
          registration.active.postMessage({
            type: 'MANIFEST_UPDATED',
            businessSlug: businessSlug
          });
        }
      });
    }

    // Limpiar al desmontar
    return () => {
      document.removeEventListener('DOMContentLoaded', setupManifest);
    };
  }, [businessSlug]);
}

// Componente React para usar en el layout
interface DynamicManifestProps {
  businessSlug?: string;
}

export default function DynamicManifest({ businessSlug }: DynamicManifestProps) {
  useDynamicManifest({ businessSlug });
  return null; // No renderiza nada, solo maneja el manifest
}
