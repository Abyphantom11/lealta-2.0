'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';

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
  const { user } = useAuth(); // Obtener usuario actual

  // Función helper para obtener URLs con slug correcto
  const getUrlWithSlug = useCallback((path: string): string => {
    if (!user?.business) {
      console.warn('No hay business disponible para redirección');
      return '/login'; // Fallback a login si no hay business
    }
    
    // Usar subdomain como slug principal (ajustar según tu estructura)
    const slug = user.business.subdomain;
    return `/${slug}${path}`;
  }, [user]);

  useEffect(() => {
    if (isElectron && window.electronAPI && user) {
      // Listen for menu actions
      window.electronAPI.onMenuAction((event, action) => {
        switch (action) {
          case 'new-client':
            window.location.href = getUrlWithSlug('/admin'); // ✅ Con slug correcto
            break;
          case 'capture-consumption':
            window.location.href = getUrlWithSlug('/staff');
            break;
          case 'dashboard':
            window.location.href = getUrlWithSlug('/admin'); // ✅ Con slug correcto
            break;
          case 'reports':
            window.location.href = getUrlWithSlug('/superadmin');
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
