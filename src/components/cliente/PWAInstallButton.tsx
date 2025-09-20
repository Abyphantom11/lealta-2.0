'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { canInstallPWA, installPWA, isPWAInstalled } from '@/services/pwaService';
import { useClientNotifications } from '@/services/clientNotificationService';

export default function PWAInstallButton() {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const { addNotification } = useClientNotifications();

  useEffect(() => {
    // console.log('🔧 PWAInstallButton useEffect iniciado');
    
    // Verificar estado inicial
    const installed = isPWAInstalled();
    const installable = canInstallPWA();
    
    // console.log('🔧 PWA Estado inicial:', { installed, installable });
    
    setIsInstalled(installed);
    setCanInstall(installable);

    // Escuchar evento pwa-ready
    const handlePWAReady = () => {
      console.log('📱 PWA Ready event recibido');
      const newCanInstall = canInstallPWA();
      const newIsInstalled = isPWAInstalled();
      setCanInstall(newCanInstall);
      setIsInstalled(newIsInstalled);
    };

    window.addEventListener('pwa-ready', handlePWAReady);

    // Escuchar cambios en la disponibilidad de instalación cada 3 segundos
    const checkInstallability = () => {
      const newCanInstall = canInstallPWA();
      const newIsInstalled = isPWAInstalled();
      
      // console.log('🔧 PWA Check periódico:', { newCanInstall, newIsInstalled });
      
      setCanInstall(newCanInstall);
      setIsInstalled(newIsInstalled);
    };

    const interval = setInterval(checkInstallability, 3000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('pwa-ready', handlePWAReady);
    };
  }, []);

  const handleInstall = async () => {
    if (isInstalling) return;
    
    setIsInstalling(true);
    
    try {
      const success = await installPWA();
      
      if (success) {
        addNotification({
          tipo: 'general',
          titulo: 'Aplicación instalada',
          mensaje: '¡Perfecto! Ya puedes acceder desde tu pantalla de inicio',
          leida: false
        });
        setCanInstall(false);
        setIsInstalled(true);
      } else {
        addNotification({
          tipo: 'general',
          titulo: 'Instalación no disponible',
          mensaje: 'El navegador no permite instalación automática en este momento',
          leida: false
        });
      }
    } catch (error) {
      console.error('Error al instalar PWA:', error);
      addNotification({
        tipo: 'general',
        titulo: 'Error al instalar',
        mensaje: 'Hubo un problema al intentar instalar la aplicación',
        leida: false
      });
    } finally {
      setIsInstalling(false);
    }
  };

  // Mostrar estado de debug en desarrollo
  if (process.env.NODE_ENV === 'development') {
    if (isInstalled) {
      return (
        <div className="w-full px-4 py-3 bg-green-600 text-white rounded-lg text-sm font-medium text-center">
          ✅ PWA ya instalada
        </div>
      );
    }

    if (!canInstall) {
      return (
        <div className="w-full space-y-3 px-4 py-3 bg-orange-600 text-white rounded-lg text-sm">
          <div className="font-medium text-center">
            ⏳ Chrome aún no activó la instalación automática
          </div>
          <div className="text-xs space-y-2">
            <div className="font-medium">📱 Instalación manual:</div>
            <div>1. Toca el menú ⋮ de Chrome</div>
            <div>2. Busca "Instalar app" o "Agregar a pantalla de inicio"</div>
            <div>3. Confirma la instalación</div>
          </div>
          <div className="text-xs text-center opacity-90 border-t border-orange-400 pt-2 mt-2">
            El prompt automático aparecerá después de usar más la app
          </div>
        </div>
      );
    }

    // Mostrar cuando SÍ está disponible el prompt nativo
    return (
      <div className="w-full space-y-2">
        <div className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs text-center">
          ✅ Acceso rápido disponible
        </div>
        <button
          onClick={handleInstall}
          disabled={isInstalling}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-blue-400 disabled:to-purple-400 text-white rounded-lg transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
        >
          <Download size={18} className={isInstalling ? 'animate-bounce' : ''} />
          <span>
            {isInstalling ? '📱 Instalando...' : '📲 Instalar App'}
          </span>
        </button>
      </div>
    );
  }

  // No mostrar si ya está instalada (en producción)
  if (isInstalled) {
    return null;
  }

  // No mostrar si no se puede instalar (en producción)
  if (!canInstall) {
    return null;
  }

  return (
    <button
      onClick={handleInstall}
      disabled={isInstalling}
      className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-blue-400 disabled:to-purple-400 text-white rounded-lg transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
      aria-label="Instalar aplicación en pantalla de inicio"
    >
      <Download size={18} className={isInstalling ? 'animate-bounce' : ''} />
      <span>
        {isInstalling 
          ? '📱 Instalando...' 
          : /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
            ? '📲 Instalar App'
            : '🚀 Agregar al Inicio'
        }
      </span>
    </button>
  );
}
