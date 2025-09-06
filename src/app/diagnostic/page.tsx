'use client';
import { useEffect, useState } from 'react';
import { runBrowserDiagnostic } from '@/utils/browserDiagnostic';

export default function DiagnosticPage() {
  const [diagnosticResult, setDiagnosticResult] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [clientInfo, setClientInfo] = useState({
    userAgent: '',
    screenSize: ''
  });
  const [isClient, setIsClient] = useState(false);

  // Evitar error de hidratación - solo acceder a navigator/window en el cliente
  useEffect(() => {
    setIsClient(true);
    if (typeof navigator !== 'undefined' && typeof window !== 'undefined') {
      setClientInfo({
        userAgent: navigator.userAgent,
        screenSize: `${window.screen.width}x${window.screen.height}`
      });
    }
  }, []);

  const runDiagnostic = async () => {
    if (!isClient) return;
    
    setIsRunning(true);
    try {
      // Capturar la salida del console.log
      const originalLog = console.log;
      let diagnosticOutput = '';
      
      console.log = (message: string) => {
        diagnosticOutput += message + '\n';
        originalLog(message);
      };
      
      await runBrowserDiagnostic();
      
      // Restaurar console.log
      console.log = originalLog;
      
      setDiagnosticResult(diagnosticOutput);
    } catch (error) {
      setDiagnosticResult(`Error ejecutando diagnóstico: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          🔍 Diagnóstico de Navegador - Lealta 2.0
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-700">
              Análisis del Navegador
            </h2>
            <button
              onClick={runDiagnostic}
              disabled={isRunning}
              className={`px-4 py-2 rounded-lg font-medium ${
                isRunning 
                  ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isRunning ? 'Analizando...' : 'Ejecutar Diagnóstico'}
            </button>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 border">
            <h3 className="font-medium text-gray-700 mb-2">Información del Navegador:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">User Agent:</span>
                <div className="text-xs text-gray-600 mt-1 break-all">
                  {isClient ? clientInfo.userAgent : 'Cargando...'}
                </div>
              </div>
              <div>
                <span className="font-medium">Pantalla:</span>
                <div className="text-xs text-gray-600 mt-1">
                  {isClient ? clientInfo.screenSize : 'Cargando...'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            📋 Reporte de Diagnóstico
          </h2>
          
          {isRunning ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Ejecutando diagnóstico...</span>
            </div>
          ) : (
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto max-h-96">
              <pre className="whitespace-pre-wrap">
                {diagnosticResult || 'Ejecutando diagnóstico inicial...'}
              </pre>
            </div>
          )}
        </div>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-600 text-lg">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Instrucciones para Móvil
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>1. Abre esta página en tu móvil: <code className="bg-yellow-100 px-1 rounded">http://[tu-ip]:3001/diagnostic</code></p>
                <p>2. Revisa el reporte para identificar problemas específicos de Opera</p>
                <p>3. Sigue las recomendaciones del diagnóstico</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
