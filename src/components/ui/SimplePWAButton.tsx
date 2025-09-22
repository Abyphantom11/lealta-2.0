'use client';

import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { usePWAContext } from '@/providers/PWAProvider';
import { installPWA } from '@/services/PWAController';

interface SimplePWAButtonProps {
  position?: 'top-right' | 'bottom-right';
}

/**
 * Botón PWA simplificado - REACTIVADO
 * Estilo verde con animación a los 3 segundos y tooltip "acceso rápido a escritorio"
 */
export default function SimplePWAButton({ 
  position = 'top-right'
}: Readonly<SimplePWAButtonProps>) {
  const { state, isInitialized } = usePWAContext();
  const [isInstalling, setIsInstalling] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Animación de aparición a los 3 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowButton(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleInstall = async () => {
    if (!state.deferredPrompt || isInstalling) return;
    
    setIsInstalling(true);
    try {
      const success = await installPWA();
      if (success) {
        console.log('✅ PWA instalada exitosamente desde SimplePWAButton');
      }
    } catch (error) {
      console.error('❌ Error instalando PWA:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleButtonClick = () => {
    if (state.deferredPrompt) {
      handleInstall();
    } else {
      // Mostrar notificación informativa
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 3000);
    }
  };

  // No mostrar si no está inicializado, no es instalable, o ya está instalado
  if (!isInitialized || !showButton || state.isInstalled) {
    return null;
  }

  const positionClasses = position === 'top-right' 
    ? 'top-4 right-4' 
    : 'bottom-4 right-4';

  return (
    <div className={`fixed ${positionClasses} z-50 transition-all duration-500 ${
      showButton ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-2'
    }`}>
      {/* Tooltip de notificación "acceso rápido a escritorio" */}
      {showTooltip && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-gray-800 text-white text-sm p-3 rounded-lg shadow-lg border border-gray-600 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-start gap-2">
            <span className="text-green-400">💻</span>
            <div>
              <div className="font-medium text-green-300">Acceso Rápido a Escritorio</div>
              <div className="text-gray-300 mt-1">
                {state.deferredPrompt 
                  ? "Instala la app para acceder más rápido desde tu escritorio"
                  : "Funcionalidad disponible en navegadores compatibles"
                }
              </div>
            </div>
          </div>
          <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-800 border-l border-t border-gray-600 transform rotate-45"></div>
        </div>
      )}

      {/* Botón principal verde */}
      <button
        onClick={handleButtonClick}
        disabled={isInstalling}
        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
        title="Acceso rápido a escritorio"
      >
        {isInstalling ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Download className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}
