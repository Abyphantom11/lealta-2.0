'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';

// Helper functions para reducir complejidad cognitiva
const detectBrowser = (userAgent: string) => {
  const isOpera = userAgent.includes('OPR/') || userAgent.includes('Opera/');
  const isChrome = userAgent.includes('Chrome/') && !isOpera;
  const isFirefox = userAgent.includes('Firefox/');
  const isSafari = userAgent.includes('Safari/') && !isChrome && !isOpera;
  const hasServiceWorker = 'serviceWorker' in navigator;
  
  let browserName = 'Desconocido';
  if (isOpera) browserName = 'Opera 🟠';
  else if (isChrome) browserName = 'Chrome 🔵';
  else if (isFirefox) browserName = 'Firefox 🟣';
  else if (isSafari) browserName = 'Safari 🍎';
  
  return {
    name: browserName,
    isOpera,
    isChrome,
    isFirefox,
    isSafari,
    hasServiceWorker,
    userAgent: userAgent.substring(0, 80) + '...'
  };
};

const setupOperaFallbackTest = async (isOpera: boolean, hasServiceWorker: boolean, addMessage: (msg: string) => void) => {
  if (!isOpera || hasServiceWorker) {
    return 'no-necesario';
  }
  
  try {
    addMessage('🔧 Activando fallback para Opera...');
    const { setupOperaFallback } = await import('@/utils/operaFallback');
    const fallback = setupOperaFallback();
    
    if (fallback) {
      addMessage('✅ Fallback Opera activado');
      return { success: true, fallback };
    } else {
      addMessage('❌ Fallback Opera falló');
      return { success: false };
    }
  } catch (error) {
    addMessage(`❌ Error activando fallback: ${error}`);
    return { success: false };
  }
};

const testStorage = async (operaFallback: any, addMessage: (msg: string) => void) => {
  const testKey = 'test-session-' + Date.now();
  const testData = { test: true, timestamp: Date.now() };
  
  try {
    if (operaFallback?.storageManager) {
      await operaFallback.storageManager.save(testKey, testData);
      const retrieved = operaFallback.storageManager.load(testKey);
      
      const result = {
        method: 'opera-fallback',
        saved: true,
        retrieved: !!retrieved,
        match: JSON.stringify(retrieved) === JSON.stringify(testData)
      };
      addMessage('✅ Almacenamiento Opera fallback: OK');
      return result;
    } else {
      localStorage.setItem(testKey, JSON.stringify(testData));
      const retrieved = JSON.parse(localStorage.getItem(testKey) || 'null');
      
      const result = {
        method: 'localStorage',
        saved: true,
        retrieved: !!retrieved,
        match: JSON.stringify(retrieved) === JSON.stringify(testData)
      };
      addMessage('✅ localStorage: OK');
      return result;
    }
  } catch (error) {
    const result = {
      saved: false,
      error: String(error)
    };
    addMessage(`❌ Error almacenamiento: ${error}`);
    return result;
  }
};

const testNotifications = (addMessage: (msg: string) => void) => {
  if (!('Notification' in window)) {
    addMessage('❌ Notificaciones: No soportadas');
    return { supported: false };
  }
  
  const result = {
    supported: true,
    permission: Notification.permission
  };
  
  const perm = Notification.permission;
  if (perm === 'granted') addMessage('✅ Notificaciones: Autorizadas');
  else if (perm === 'default') addMessage('⚠️ Notificaciones: Sin solicitar');
  else addMessage('❌ Notificaciones: Denegadas');
  
  return result;
};

const testPWACapabilities = (addMessage: (msg: string) => void) => {
  const result = {
    standalone: window.matchMedia('(display-mode: standalone)').matches,
    beforeInstallPrompt: 'beforeinstallprompt' in window,
    manifest: document.querySelector('link[rel="manifest"]') !== null
  };
  
  addMessage(`📱 PWA: ${result.standalone ? 'Instalada' : 'Web'}`);
  addMessage(`📋 Manifest: ${result.manifest ? '✅' : '❌'}`);
  
  return result;
};

const testMobileCapabilities = (addMessage: (msg: string) => void) => {
  if (typeof window === 'undefined') return null;
  
  const result = {
    touchScreen: 'ontouchstart' in window,
    orientation: 'orientation' in window,
    deviceMotion: 'DeviceMotionEvent' in window,
    vibrate: 'vibrate' in navigator
  };
  
  const isMobile = result.touchScreen;
  addMessage(`📱 Dispositivo: ${isMobile ? 'Móvil' : 'Desktop'}`);
  
  return result;
};

const getBrowserDisplayName = (userAgent: string) => {
  if (userAgent.includes('OPR/')) return '🟠 Opera';
  if (userAgent.includes('Chrome/')) return '🔵 Chrome';
  if (userAgent.includes('Firefox/')) return '🟣 Firefox';
  if (userAgent.includes('Safari/')) return '🍎 Safari';
  return '❓ Otro';
};

export default function TestOperaPage() {
  const [results, setResults] = useState<any>({});
  const [operaFallback, setOperaFallback] = useState<any>(null);
  const [testMessages, setTestMessages] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const addMessage = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestMessages(prev => [...prev, `${timestamp}: ${message}`]);
    logger.log(message);
  };

  const testOperaCompatibility = async () => {
    if (!isClient || typeof window === 'undefined') {
      addMessage('❌ Cliente no listo');
      return;
    }

    setIsLoading(true);
    setTestMessages([]);
    
    try {
      const testResults: any = {};
      
      addMessage('🔍 Iniciando pruebas...');
      
      // Test 1: Detectar navegador
      const browserInfo = detectBrowser(navigator.userAgent);
      testResults.browser = browserInfo;
      
      addMessage(`🔍 Navegador detectado: ${browserInfo.name}`);
      addMessage(`🔍 Service Worker: ${browserInfo.hasServiceWorker ? '✅ Disponible' : '❌ Bloqueado'}`);
      
      // Test 2: Activar fallback si es Opera sin SW
      const operaFallbackResult = await setupOperaFallbackTest(
        browserInfo.isOpera, 
        browserInfo.hasServiceWorker, 
        addMessage
      );
      
      if (typeof operaFallbackResult === 'object' && operaFallbackResult.success) {
        setOperaFallback(operaFallbackResult.fallback);
        testResults.operaFallback = true;
      } else if (typeof operaFallbackResult === 'object') {
        testResults.operaFallback = false;
      } else {
        testResults.operaFallback = operaFallbackResult;
      }
      
      // Test 3: Almacenamiento
      testResults.storage = await testStorage(operaFallback, addMessage);
      
      // Test 4: Notificaciones
      testResults.notifications = testNotifications(addMessage);
      
      // Test 5: PWA
      testResults.pwa = testPWACapabilities(addMessage);
      
      // Test 6: Capacidades móviles
      testResults.mobile = testMobileCapabilities(addMessage);
      
      setResults(testResults);
      addMessage('🏁 ¡Pruebas completadas!');
      
    } catch (error) {
      addMessage(`💥 Error general: ${error}`);
      logger.error('Error en pruebas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestNotifications = async () => {
    if (!isClient || !('Notification' in window)) return;
    
    try {
      const permission = await Notification.requestPermission();
      addMessage(`🔔 Permiso solicitado: ${permission}`);
      
      if (permission === 'granted') {
        new Notification('¡Funciona!', {
          body: 'Las notificaciones están activas',
          icon: '/favicon.ico'
        });
        addMessage('📬 Notificación enviada');
      }
    } catch (error) {
      addMessage(`❌ Error notificaciones: ${error}`);
    }
  };

  const clearData = () => {
    if (!isClient) return;
    
    try {
      // Limpiar localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('test-session-')) {
          localStorage.removeItem(key);
        }
      });
      
      // Limpiar Opera fallback si existe
      if (operaFallback?.storageManager) {
        // Limpiar datos de prueba del fallback
        try {
          operaFallback.storageManager.save('test-session', null);
        } catch {}
      }
      
      addMessage('🧹 Datos de prueba limpiados');
      
    } catch (error) {
      addMessage(`❌ Error limpiando: ${error}`);
    }
  };

  // Auto-ejecutar cuando esté listo
  useEffect(() => {
    if (isClient) {
      const timer = setTimeout(() => {
        testOperaCompatibility();
      }, 500);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient]);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <div className="flex items-center gap-4">
            <div className="animate-spin h-8 w-8 border-3 border-blue-600 rounded-full border-t-transparent"></div>
            <span className="text-xl font-semibold text-gray-700">Inicializando...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              🧪 Laboratorio de Compatibilidad
            </h1>
            <p className="text-gray-600">
              Pruebas avanzadas para navegadores móviles y desktop
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Panel de Control */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold text-gray-800 mb-3">🎮 Controles</h3>
                
                <button
                  onClick={testOperaCompatibility}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed mb-3 hover:from-blue-700 hover:to-blue-800 transition-colors"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                      Ejecutando...
                    </div>
                  ) : (
                    '🔄 Ejecutar Pruebas Completas'
                  )}
                </button>
                
                <button
                  onClick={requestNotifications}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 font-medium mb-3"
                >
                  🔔 Probar Notificaciones
                </button>
                
                <button
                  onClick={clearData}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 font-medium"
                >
                  🧹 Limpiar Datos
                </button>
              </div>
              
              {/* Info rápida */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-bold text-blue-800 mb-2">ℹ️ Info Rápida:</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <div><strong>Navegador:</strong> {getBrowserDisplayName(navigator.userAgent)}</div>
                  <div><strong>Service Worker:</strong> {'serviceWorker' in navigator ? '✅' : '❌'}</div>
                  <div><strong>Táctil:</strong> {'ontouchstart' in window ? '✅' : '❌'}</div>
                </div>
              </div>
            </div>
            
            {/* Log en tiempo real */}
            <div className="lg:col-span-1">
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
                <div className="font-bold text-green-300 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span>📋 Log en vivo</span>
                </div>
                {testMessages.length === 0 ? (
                  <div className="text-gray-500 italic">Esperando ejecución...</div>
                ) : (
                  testMessages.map((message, index) => (
                    <div key={`message-${index}-${message.slice(0, 20)}`} className="mb-1 break-words leading-relaxed">
                      {message}
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="text-yellow-400 animate-pulse">
                    ⏳ Ejecutando pruebas...
                  </div>
                )}
              </div>
            </div>
            
            {/* Resultados */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 p-4 rounded-lg h-96 overflow-y-auto">
                <h3 className="font-bold text-gray-800 mb-3">📊 Resultados Detallados:</h3>
                
                {Object.keys(results).length > 0 ? (
                  <pre className="text-xs bg-white p-3 rounded border overflow-x-auto whitespace-pre-wrap font-mono">
                    {JSON.stringify(results, null, 2)}
                  </pre>
                ) : (
                  <div className="text-gray-500 text-center py-12">
                    <div className="text-4xl mb-2">🔬</div>
                    <div>
                      {isLoading ? 'Analizando navegador...' : 'Ejecuta las pruebas para ver resultados'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Enlaces de navegación */}
          <div className="mt-8 text-center space-x-4">
            <a 
              href="/cliente"
              className="inline-block bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 font-medium transition-colors"
            >
              ← Portal Cliente
            </a>
            <a 
              href="/diagnostic"
              className="inline-block bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              🔍 Diagnóstico Completo
            </a>
          </div>
          
          {/* Footer informativo */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
            <p>
              💡 <strong>Consejo:</strong> Para Safari en iOS, algunas funciones PWA requieren añadir a pantalla de inicio
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
