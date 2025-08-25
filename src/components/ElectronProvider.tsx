'use client';

import { useEffect, useState } from 'react';

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
        } catch (error) {
          console.log('Error getting Electron info:', error);
        }
      }
    };

    checkElectron();
  }, []);

  return {
    isElectron,
    platform,
    version,
    electronAPI: typeof window !== 'undefined' ? window.electronAPI : null
  };
}

export function ElectronProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const { isElectron } = useElectron();

  useEffect(() => {
    if (isElectron && window.electronAPI) {
      // Listen for menu actions
      window.electronAPI.onMenuAction((event, action) => {
        switch (action) {
          case 'new-client':
            window.location.href = '/admin'; // Redirigir a admin para gestionar clientes
            break;
          case 'capture-consumption':
            window.location.href = '/staff';
            break;
          case 'dashboard':
            window.location.href = '/admin';
            break;
          case 'reports':
            window.location.href = '/superadmin';
            break;
          default:
            console.log('Unknown menu action:', action);
        }
      });

      return () => {
        window.electronAPI?.removeAllListeners('menu-action');
      };
    }
  }, [isElectron]);

  return <>{children}</>;
}

// Component to show different content based on platform
export function PlatformAware({ 
  web, 
  desktop, 
  children 
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
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification(title, { body });
          }
        });
      }
    }
  };

  return { showNotification };
}
