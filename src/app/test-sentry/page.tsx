'use client';

import { useState, useEffect } from 'react';

export default function TestSentryPage() {
  const [message, setMessage] = useState('');
  const [level, setLevel] = useState<'info' | 'warning' | 'error'>('info');
  const [sentryLoaded, setSentryLoaded] = useState(false);
  const [dsn, setDsn] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (log: string) => {
    setLogs(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${log}`]);
  };

  useEffect(() => {
    // Verificar múltiples formas de acceso a Sentry
    const checkSentry = () => {
      // Método 1: Verificar si Sentry está en window
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        setSentryLoaded(true);
        setDsn(process.env.NEXT_PUBLIC_SENTRY_DSN || 'No configurado');
        addLog('✅ Sentry encontrado en window.Sentry');
        return true;
      }

      // Método 2: Verificar si el módulo está disponible globalmente
      try {
        if (typeof window !== 'undefined') {
          const sentryScript = document.querySelector('script[src*="sentry"]');
          if (sentryScript) {
            addLog('✅ Script de Sentry encontrado en DOM');
          }
        }
      } catch (error) {
        addLog('ℹ️ No se encontró script de Sentry en DOM');
      }

      return false;
    };

    // Verificar inmediatamente
    if (checkSentry()) {
      return;
    }

    // Intentar cargar dinámicamente después de un delay
    const timer = setTimeout(async () => {
      try {
        // Forzar import dinámico
        const sentryModule = await import('@sentry/nextjs');
        if (sentryModule) {
          setSentryLoaded(true);
          setDsn(process.env.NEXT_PUBLIC_SENTRY_DSN || 'No configurado');
          addLog('✅ Sentry cargado dinámicamente');
          
          // Configurar en window para acceso global
          (window as any).Sentry = sentryModule;
        }
      } catch (error) {
        addLog('❌ Error cargando Sentry dinámicamente: ' + (error as Error).message);
        
        // Último intento: verificar si hay configuración
        const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
        if (!dsn) {
          addLog('❌ NEXT_PUBLIC_SENTRY_DSN no está configurado');
        } else {
          addLog('ℹ️ DSN configurado pero Sentry no se carga');
          setDsn(dsn);
        }
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getSentry = () => {
    if ((window as any).Sentry) {
      return (window as any).Sentry;
    }
    return null;
  };

  const handleSendEvent = async () => {
    const Sentry = getSentry();
    if (!Sentry) {
      addLog('❌ Sentry no está disponible');
      return;
    }

    try {
      const testMessage = message || 'Evento de prueba desde página de testing';
      
      addLog(`📤 Enviando mensaje: "${testMessage}" con nivel: ${level}`);
      
      // Añadir breadcrumb
      Sentry.addBreadcrumb({
        message: 'Usuario envió evento de prueba',
        level: level,
        timestamp: Date.now(),
        category: 'test-page'
      });

      // Enviar el evento
      const eventId = Sentry.captureMessage(testMessage, level);
      
      addLog(`✅ Evento enviado con ID: ${eventId}`);
      alert('Evento enviado a Sentry exitosamente! ✅\nRevisa la consola para más detalles.');
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      addLog(`❌ Error enviando evento: ${errorMsg}`);
      console.error('Error enviando evento a Sentry:', error);
      alert('Error enviando evento a Sentry ❌');
    }
  };

  const handleSendError = async () => {
    const Sentry = getSentry();
    if (!Sentry) {
      addLog('❌ Sentry no está disponible');
      return;
    }

    try {
      addLog('📤 Enviando error simulado...');
      
      // Crear un error simulado
      const testError = new Error('Error de prueba simulado para testing de Sentry');
      testError.name = 'TestSentryError';
      testError.stack = `TestSentryError: Error de prueba simulado para testing de Sentry
    at handleSendError (test-sentry/page.tsx:${Date.now()})
    at onClick (test-sentry/page.tsx:${Date.now()})`;
      
      const eventId = Sentry.captureException(testError, {
        tags: {
          section: 'test-page',
          environment: process.env.NODE_ENV || 'development',
          testType: 'simulated-error'
        },
        extra: {
          userAction: 'test-error-button',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        },
        level: 'error'
      });
      
      addLog(`✅ Error enviado con ID: ${eventId}`);
      alert('Error simulado enviado a Sentry exitosamente! ✅\nRevisa la consola para más detalles.');
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      addLog(`❌ Error enviando excepción: ${errorMsg}`);
      console.error('Error enviando excepción a Sentry:', error);
      alert('Error enviando excepción a Sentry ❌');
    }
  };

  const handleSetUser = async () => {
    const Sentry = getSentry();
    if (!Sentry) {
      addLog('❌ Sentry no está disponible');
      return;
    }

    try {
      const testUser = {
        id: `test-user-${Date.now()}`,
        email: 'test@lealta.app',
        username: 'TestUser',
        ip_address: '{{auto}}',
      };
      
      Sentry.setUser(testUser);
      addLog(`✅ Usuario configurado: ${testUser.id}`);
      alert('Usuario de prueba configurado en Sentry ✅');
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      addLog(`❌ Error configurando usuario: ${errorMsg}`);
    }
  };

  const handleTestCrash = () => {
    addLog('💥 Simulando crash de aplicación...');
    // Esto causará un error real que Sentry debería capturar automáticamente
    setTimeout(() => {
      throw new Error('Crash simulado de la aplicación - esto debería aparecer en Sentry automáticamente');
    }, 100);
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('🧹 Logs limpiados');
  };

  const formatDsn = (dsnString: string) => {
    if (!dsnString || dsnString === 'No configurado') return dsnString;
    return dsnString.length > 50 ? dsnString.substring(0, 50) + '...' : dsnString;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🚀 Test Sentry Integration
            </h1>
            <p className="text-gray-600">
              Página de prueba avanzada para verificar que Sentry está funcionando correctamente
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Panel de Control */}
            <div className="space-y-6">
              {/* Estado de Sentry */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">
                  📊 Estado de Sentry
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Estado:</span>
                    <span className={sentryLoaded ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {sentryLoaded ? '✅ Cargado' : '❌ No cargado'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Environment:</span>
                    <span className="font-mono text-xs">{process.env.NODE_ENV || 'development'}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span>DSN:</span>
                    <span className="font-mono text-xs text-right max-w-[200px] break-all">
                      {formatDsn(dsn)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Configurar Usuario */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">
                  👤 Configurar Usuario de Prueba
                </h2>
                <button
                  onClick={handleSetUser}
                  disabled={!sentryLoaded}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Configurar Usuario en Sentry
                </button>
              </div>

              {/* Enviar Mensaje */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">
                  📧 Enviar Mensaje Personalizado
                </h2>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Escribe tu mensaje de prueba..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as 'info' | 'warning' | 'error')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                  <button
                    onClick={handleSendEvent}
                    disabled={!sentryLoaded}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    Enviar Mensaje a Sentry
                  </button>
                </div>
              </div>

              {/* Enviar Error */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">
                  ⚠️ Simular Errores
                </h2>
                <div className="space-y-2">
                  <button
                    onClick={handleSendError}
                    disabled={!sentryLoaded}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    Enviar Error Controlado
                  </button>
                  <button
                    onClick={handleTestCrash}
                    disabled={!sentryLoaded}
                    className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    💥 Simular Crash Real
                  </button>
                </div>
              </div>
            </div>

            {/* Panel de Logs */}
            <div className="space-y-6">
              {/* Logs en Tiempo Real */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-semibold text-gray-800">
                    📋 Logs en Tiempo Real
                  </h2>
                  <button
                    onClick={clearLogs}
                    className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md transition-colors"
                  >
                    Limpiar
                  </button>
                </div>
                <div className="bg-gray-900 text-green-400 rounded-md p-4 h-80 overflow-y-auto font-mono text-xs">
                  {logs.length === 0 ? (
                    <div className="text-gray-500">Esperando eventos...</div>
                  ) : (
                    logs.map((log, index) => (
                      <div key={`log-${Date.now()}-${index}`} className="mb-1">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Información */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-md font-semibold text-blue-800 mb-2">
                  ℹ️ Información de Debugging
                </h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Los eventos aparecen en tiempo real en los logs</li>
                  <li>• Verifica tu dashboard de Sentry después de enviar</li>
                  <li>• Los eventos pueden tardar 1-2 minutos en aparecer</li>
                  <li>• El crash real debería capturarse automáticamente</li>
                  <li>• Revisa la consola del navegador para más detalles</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}