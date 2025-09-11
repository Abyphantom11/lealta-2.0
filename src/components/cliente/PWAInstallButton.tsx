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
    // Verificar estado inicial
    setIsInstalled(isPWAInstalled());
    setCanInstall(canInstallPWA());

    // Escuchar cambios en la disponibilidad de instalación
    const checkInstallability = () => {
      setCanInstall(canInstallPWA());
      setIsInstalled(isPWAInstalled());
    };

    // Verificar cada 2 segundos si se puede instalar
    const interval = setInterval(checkInstallability, 2000);

    return () => clearInterval(interval);
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
          titulo: 'Instalación disponible',
          mensaje: 'Para instalar, usa el menú de tu navegador > "Agregar a pantalla de inicio"',
          leida: false
        });
      }
    } catch (error) {
      console.error('Error al instalar PWA:', error);
      addNotification({
        tipo: 'general',
        titulo: 'Error al instalar',
        mensaje: 'Intenta instalar desde el menú del navegador',
        leida: false
      });
    } finally {
      setIsInstalling(false);
    }
  };

  // No mostrar si ya está instalada
  if (isInstalled) {
    return null;
  }

  // No mostrar si no se puede instalar
  if (!canInstall) {
    return null;
  }

  return (
    <button
      onClick={handleInstall}
      disabled={isInstalling}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
      aria-label="Instalar aplicación en pantalla de inicio"
    >
      <Download size={16} />
      {isInstalling ? 'Instalando...' : 'Agregar al inicio'}
    </button>
  );
}
