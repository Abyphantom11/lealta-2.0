/**
 * 🎯 COMPONENTE PWA DOWNLOAD BUTTON PARA LOGIN
 * 
 * Botón discreto tipo descargar en la esquina superior derecha de /login
 * Aparece cuando PWA está disponible para instalación (solo Chrome)
 */

'use client';

import { useState } from 'react';
import { Download, X } from 'lucide-react';
import { usePWAContext } from '@/providers/PWAProvider';
import { installPWA } from '@/services/PWAController';

interface PWADownloadButtonProps {
  className?: string;
}

export function PWADownloadButton({ className = '' }: PWADownloadButtonProps) {
  const { state, isInitialized } = usePWAContext();
  const [isInstalling, setIsInstalling] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleInstall = async () => {
    if (!state.deferredPrompt || isInstalling) return;
    
    setIsInstalling(true);
    try {
      const success = await installPWA();
      if (success) {
        setIsHidden(true); // Ocultar después de instalación exitosa
      }
    } catch (error) {
      console.error('❌ Error instalando PWA:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleNotificationClick = () => {
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 3000);
  };

  // No mostrar si está oculto, no inicializado, no instalable, ya instalado o no hay prompt
  if (isHidden || !isInitialized || !state.isInstallable || state.isInstalled || !state.deferredPrompt) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      {/* Tooltip de notificación */}
      {showTooltip && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-gray-800 text-white text-sm p-3 rounded-lg shadow-lg border border-gray-600">
          <div className="flex items-start gap-2">
            <span className="text-blue-400">📱</span>
            <div>
              <div className="font-medium text-blue-300">Acceso Rápido Disponible</div>
              <div className="text-gray-300 mt-1">
                Instala la app para acceso más fácil desde tu pantalla de inicio
              </div>
            </div>
          </div>
          <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-800 border-l border-t border-gray-600 transform rotate-45"></div>
        </div>
      )}

      {/* Botón principal */}
      <div className="flex items-center gap-2">
        {/* Botón de descarga */}
        <button
          onClick={handleInstall}
          disabled={isInstalling}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
          title="Instalar aplicación"
        >
          {isInstalling ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download className="w-5 h-5" />
          )}
        </button>

        {/* Botón de notificación/info */}
        <button
          onClick={handleNotificationClick}
          className="bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
          title="Más información"
        >
          <span className="text-sm font-bold">?</span>
        </button>

        {/* Botón de cerrar */}
        <button
          onClick={() => setIsHidden(true)}
          className="bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white p-1 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
          title="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default PWADownloadButton;
