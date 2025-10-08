'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share, Plus, Home } from 'lucide-react';

/**
 * 🍎 PROMPT DE INSTALACIÓN PARA iOS
 * 
 * En iOS no existe beforeinstallprompt, los usuarios deben:
 * 1. Tocar el botón de compartir en Safari
 * 2. Seleccionar "Agregar a pantalla de inicio"
 * 
 * Este componente muestra instrucciones visuales
 */

export default function IOSInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detectar iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iOS = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iOS);

    // Detectar si ya está instalado
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Solo mostrar en iOS Safari que no está instalado
    const isIOSSafari = iOS && /safari/.test(userAgent) && !/crios|fxios|edgios/.test(userAgent);
    
    // Verificar si ya se mostró antes
    const hasSeenPrompt = localStorage.getItem('ios_install_prompt_seen');
    
    if (isIOSSafari && !standalone && !hasSeenPrompt) {
      // Mostrar después de 5 segundos
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    // Recordar que ya vio el prompt
    localStorage.setItem('ios_install_prompt_seen', 'true');
  };

  const handleInstall = () => {
    // En iOS no podemos forzar la instalación, solo dar instrucciones
    // El usuario debe seguir los pasos manualmente
    setShowPrompt(false);
    localStorage.setItem('ios_install_prompt_seen', 'true');
  };

  // No mostrar si no es iOS o ya está instalado
  if (!isIOS || isStandalone) {
    return null;
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 z-[9999]"
          >
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Home className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
              Agregar a Inicio
            </h3>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
              Instala la app para acceso rápido y experiencia completa
            </p>

            {/* Instructions */}
            <div className="space-y-4 mb-6">
              {/* Step 1 */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">1</span>
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Toca el botón de <strong>Compartir</strong> 
                    <Share className="inline-block w-4 h-4 mx-1 text-blue-500" />
                    en la barra de Safari
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">2</span>
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Selecciona <strong>"Agregar a pantalla de inicio"</strong>
                    <Plus className="inline-block w-4 h-4 mx-1 text-blue-500" />
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">3</span>
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Confirma tocando <strong>"Agregar"</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleDismiss}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Ahora no
              </button>
              <button
                onClick={handleInstall}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/25"
              >
                Entendido
              </button>
            </div>

            {/* Footer note */}
            <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-4">
              El ícono aparecerá en tu pantalla de inicio
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
