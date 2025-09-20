'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface DebugVisitasProps {
  clienteId?: string;
  businessId?: string;
}

export default function DebugVisitas({ clienteId, businessId }: DebugVisitasProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const testVisitTracking = async () => {
    setIsLoading(true);
    setLastResult(null);

    try {
      const sessionId = sessionStorage.getItem('visit_session_id') || uuidv4();
      sessionStorage.setItem('visit_session_id', sessionId);

      const visitData = {
        sessionId,
        clienteId: clienteId || undefined,
        businessId: businessId || 'cmfr2y0ia0000eyvw7ef3k20u',
        path: '/cliente',
        referrer: document.referrer || undefined
      };

      console.log('🧪 Enviando datos:', visitData);

      const response = await fetch('/api/cliente/debug-visitas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(visitData)
      });

      const result = await response.json();
      console.log('🧪 Respuesta:', result);

      setLastResult({
        status: response.status,
        success: response.ok,
        data: result
      });

    } catch (error: any) {
      console.error('🧪 Error:', error);
      setLastResult({
        status: 'Error',
        success: false,
        data: { error: error.message }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testOriginalEndpoint = async () => {
    setIsLoading(true);
    setLastResult(null);

    try {
      const sessionId = sessionStorage.getItem('visit_session_id') || uuidv4();
      sessionStorage.setItem('visit_session_id', sessionId);

      const visitData = {
        sessionId,
        clienteId: clienteId || undefined,
        businessId: businessId || 'cmfr2y0ia0000eyvw7ef3k20u',
        path: '/cliente',
        referrer: document.referrer || undefined
      };

      console.log('🧪 Enviando a endpoint original:', visitData);

      const response = await fetch('/api/cliente/visitas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(visitData)
      });

      const result = await response.json();
      console.log('🧪 Respuesta original:', result);

      setLastResult({
        status: response.status,
        success: response.ok,
        data: result
      });

    } catch (error: any) {
      console.error('🧪 Error original:', error);
      setLastResult({
        status: 'Error',
        success: false,
        data: { error: error.message }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testBusinessEndpoint = async () => {
    setIsLoading(true);
    setLastResult(null);

    try {
      const testBusinessId = businessId || 'cmfr2y0ia0000eyvw7ef3k20u';
      
      console.log('🧪 Verificando visitas del business:', testBusinessId);

      const response = await fetch(`/api/cliente/test-visitas-business?businessId=${testBusinessId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      console.log('🧪 Respuesta business test:', result);

      setLastResult({
        status: response.status,
        success: response.ok,
        data: result
      });

    } catch (error: any) {
      console.error('🧪 Error business test:', error);
      setLastResult({
        status: 'Error',
        success: false,
        data: { error: error.message }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-50 max-w-md">
      <div className="text-sm font-bold mb-2">🧪 Debug Visitas</div>
      
      <div className="space-y-2 mb-3">
        <div className="text-xs text-gray-600">
          Cliente: {clienteId || 'Anónimo'}
        </div>
        <div className="text-xs text-gray-600">
          Business: {businessId}
        </div>
      </div>

      <div className="space-y-2">
        <button
          onClick={testVisitTracking}
          disabled={isLoading}
          className="w-full bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Probando...' : 'Test Debug Endpoint'}
        </button>

        <button
          onClick={testOriginalEndpoint}
          disabled={isLoading}
          className="w-full bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 disabled:opacity-50"
        >
          {isLoading ? 'Probando...' : 'Test Original Endpoint'}
        </button>

        <button
          onClick={testBusinessEndpoint}
          disabled={isLoading}
          className="w-full bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600 disabled:opacity-50"
        >
          {isLoading ? 'Verificando...' : 'Verificar Visitas Business'}
        </button>
      </div>

      {lastResult && (
        <div className="mt-3 p-2 bg-gray-100 rounded text-xs">
          <div className={`font-bold ${lastResult.success ? 'text-green-600' : 'text-red-600'}`}>
            Status: {lastResult.status}
          </div>
          <pre className="mt-1 text-xs overflow-auto max-h-32">
            {JSON.stringify(lastResult.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
