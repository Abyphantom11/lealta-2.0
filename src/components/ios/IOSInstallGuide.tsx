'use client';

import { useState, useEffect } from 'react';
import { X, Share, Plus, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface IOSInstallGuideProps {
  readonly businessName: string;
  readonly showAutomatically?: boolean;
  readonly isUserLoggedIn?: boolean; // ✅ NUEVO: Solo mostrar si está autenticado
}

/**
 * Guía de instalación para iOS
 * 
 * ✅ Solo se muestra en iPhone/iPad
 * ✅ Solo se muestra DESPUÉS de que el usuario inicie sesión
 * ✅ No afecta la experiencia en Android o Desktop
 * ✅ Se puede cerrar y volver a abrir
 * ✅ Recuerda si el usuario ya la vio
 */
export default function IOSInstallGuide({ 
  businessName, 
  showAutomatically = true,
  isUserLoggedIn = false // ✅ Por defecto no mostrar hasta que inicie sesión
}: IOSInstallGuideProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInStandalone, setIsInStandalone] = useState(false);

  useEffect(() => {
    // Detectar iOS (iPhone, iPad, iPod)
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);
    
    // Detectar si ya está instalado (standalone mode en iOS)
    const standalone = ('standalone' in window.navigator) && (window.navigator as any).standalone;
    setIsInStandalone(standalone);
    
    // Verificar si ya mostró las instrucciones anteriormente
    const hasSeenGuide = localStorage.getItem(`ios-install-guide-${businessName}`);
    
    // ✅ NUEVO: Mostrar automáticamente solo si:
    // - Es iOS
    // - No está instalado como app
    // - No ha visto la guía antes
    // - showAutomatically está habilitado
    // - EL USUARIO YA INICIÓ SESIÓN (isUserLoggedIn = true)
    if (iOS && !standalone && !hasSeenGuide && showAutomatically && isUserLoggedIn) {
      setTimeout(() => setIsVisible(true), 2000); // Espera 2s para no ser intrusivo
    }
  }, [businessName, showAutomatically, isUserLoggedIn]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(`ios-install-guide-${businessName}`, 'seen');
  };

  const handleShowAgain = () => {
    setIsVisible(true);
  };

  // ✅ No renderizar nada si:
  // - No es iOS
  // - Ya está instalado
  // - El usuario NO ha iniciado sesión
  if (!isIOS || isInStandalone || !isUserLoggedIn) return null;

  return (
    <>
      {/* Botón flotante para abrir la guía (solo si está cerrada) */}
      {!isVisible && (
        <button
          onClick={handleShowAgain}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all z-40 animate-pulse"
          aria-label="Ver instrucciones de instalación"
          title="Instalar como app"
        >
          <Home className="w-6 h-6" />
        </button>
      )}

      {/* Modal con instrucciones detalladas */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleDismiss}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-blue-500/30"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-2xl">
                    🍎
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Instalar {businessName}</h3>
                    <p className="text-sm text-gray-400">En tu iPhone o iPad</p>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                  aria-label="Cerrar"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Instrucciones paso a paso */}
              <div className="space-y-4 mb-6">
                {/* Paso 1 */}
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">1</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium mb-2">Toca el botón de Compartir</p>
                      <div className="flex items-center space-x-2 text-gray-400 text-sm mb-2">
                        <Share className="w-4 h-4" />
                        <span>En la barra inferior de Safari</span>
                      </div>
                      <div className="bg-slate-900 rounded p-2 border border-slate-600">
                        <p className="text-xs text-gray-400 text-center">
                          Busca el ícono de compartir{' '}
                          <span className="inline-block">📤</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Paso 2 */}
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">2</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium mb-2">Selecciona &quot;Añadir a inicio&quot;</p>
                      <div className="flex items-center space-x-2 text-gray-400 text-sm mb-2">
                        <Plus className="w-4 h-4" />
                        <span>Desplázate hacia abajo en el menú</span>
                      </div>
                      <div className="bg-slate-900 rounded p-2 border border-slate-600">
                        <p className="text-xs text-gray-400 text-center">
                          Busca <span className="font-semibold text-white">&quot;Añadir a inicio&quot;</span> o{' '}
                          <span className="font-semibold text-white">&quot;Add to Home Screen&quot;</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Paso 3 */}
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">3</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium mb-2">Confirma tocando &quot;Añadir&quot;</p>
                      <div className="flex items-center space-x-2 text-gray-400 text-sm mb-2">
                        <Home className="w-4 h-4" />
                        <span>La app aparecerá en tu pantalla de inicio</span>
                      </div>
                      <div className="bg-green-900/30 rounded p-2 border border-green-700/50">
                        <p className="text-xs text-green-400 text-center font-medium">
                          ✨ ¡Listo! Ahora podrás acceder con un toque
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-700 pt-4">
                <div className="bg-blue-900/20 rounded-lg p-3 mb-3 border border-blue-700/30">
                  <p className="text-center text-sm text-blue-300">
                    💡 <span className="font-medium">Tip:</span> Una vez instalada, la app abrirá en pantalla completa sin el navegador
                  </p>
                </div>
                <button
                  onClick={handleDismiss}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
