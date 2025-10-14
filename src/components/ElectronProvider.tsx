'use client';

import { useEffect, useState, useCallback } from 'react';

// Types for Electron API
declare global {
  interface Window {
    electronAPI?: {
      getVersion: () => Promise<string>;
      getPlatform: () => Promise<string>;
      onMenuAction: (callback: (event: any, action: string) => void) => void;
      removeAllListeners: (channel: string) => void;
      showNotification: (title: string, body: string) => void;
      isElectron: boolean;
      isDesktop: boolean;
    };
  }
}

export function useElectron() {
  const [isElectron, setIsElectron] = useState(false);
  const [platform, setPlatform] = useState<string>('');
  const [version, setVersion] = useState<string>('');

  useEffect(() => {
    const checkElectron = async () => {
      if (typeof window !== 'undefined' && window.electronAPI) {
        setIsElectron(true);
        try {
          const platformInfo = await window.electronAPI.getPlatform();
          const versionInfo = await window.electronAPI.getVersion();
          setPlatform(platformInfo);
          setVersion(versionInfo);
        } catch {
          // Error getting Electron info - silent fallback
        }
      }
    };

    checkElectron();
  }, []);

  return {
    isElectron,
    platform,
    version,
    electronAPI: typeof window !== 'undefined' ? window.electronAPI : null,
  };
}

export function ElectronProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { isElectron } = useElectron();
  
  // 🔥 DESHABILITAR useAuth COMPLETAMENTE EN ElectronProvider
  // useAuth se ejecutará solo en páginas que realmente lo necesiten
  // No en layout global que afecta todas las rutas
  
  // � Por ahora, sin autenticación global en ElectronProvider
  const user = null;

  // Función helper para obtener URLs (simplificada sin auth)
  const getUrlWithSlug = useCallback((path: string): string => {
    // Para ElectronProvider simplificado, usar rutas genéricas
    // La autenticación será manejada por cada página individualmente
    console.warn('ElectronProvider: Sin business disponible, usando ruta genérica para:', path);
    return '/login'; // Fallback a login
  }, []);

  useEffect(() => {
    if (isElectron && window.electronAPI) {
      // Listen for menu actions - simplificado sin auth
      window.electronAPI.onMenuAction((event, action) => {
        switch (action) {
          case 'new-client':
            window.location.href = '/login'; // Redirect genérico
            break;
          case 'capture-consumption':
            window.location.href = '/login';
            break;
          case 'dashboard':
            window.location.href = '/login'; 
            break;
          case 'reports':
            window.location.href = '/login';
            break;
          default:
            // Unknown menu action - silent fallback
            break;
        }
      });

      return () => {
        window.electronAPI?.removeAllListeners('menu-action');
      };
    }
  }, [isElectron, user, getUrlWithSlug]); // ✅ Dependencias correctas

  return <>{children}</>;
}

// Component to show different content based on platform
export function PlatformAware({
  web,
  desktop,
  children,
}: Readonly<{
  web?: React.ReactNode;
  desktop?: React.ReactNode;
  children?: React.ReactNode;
}>) {
  const { isElectron } = useElectron();

  if (isElectron && desktop) {
    return <>{desktop}</>;
  }

  if (!isElectron && web) {
    return <>{web}</>;
  }

  return <>{children}</>;
}

// Hook for showing notifications
export function useNotification() {
  const { isElectron, electronAPI } = useElectron();

  const showNotification = (title: string, body: string) => {
    if (isElectron && electronAPI) {
      electronAPI.showNotification(title, body);
    } else if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(title, { body });
          }
        });
      }
    }
  };

  return { showNotification };
}
