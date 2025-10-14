'use client';

import { useState } from 'react';
import { Smartphone } from 'lucide-react';
import { usePWAContext } from '@/providers/PWAProvider';
import { installPWA } from '@/services/PWAController';

export default function PWAInstallButton() {
  const { state, isInitialized } = usePWAContext();
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = async () => {
    if (!state.deferredPrompt || isInstalling) return;
    
    setIsInstalling(true);
    try {
      await installPWA();
    } catch (error) {
      console.error('❌ Error instalando PWA:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  // No mostrar si no está inicializado o no es instalable
  if (!isInitialized || !state.isInstallable || state.isInstalled || !state.deferredPrompt) {
    return null;
  }

  return (
    <button
      onClick={handleInstall}
      disabled={isInstalling}
      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
    >
      {isInstalling ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Instalando...
        </>
      ) : (
        <>
          <Smartphone className="w-4 h-4" />
          Instalar App
        </>
      )}
    </button>
  );
}
