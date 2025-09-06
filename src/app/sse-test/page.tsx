'use client';

import { useEffect } from 'react';
import { logger } from '@/utils/logger';

export default function SSETestPage() {
  logger.log('🧪 SSE TEST PAGE: Iniciando...');
  
  useEffect(() => {
    logger.log('🧪 SSE TEST: Ejecutando useEffect...');
    
    setTimeout(() => {
      logger.log('🧪 SSE TEST: Iniciando conexión EventSource...');
      
      const eventSource = new EventSource('/api/admin/portal-config/stream');
      
      eventSource.onopen = () => {
        logger.log('✅ SSE TEST: ¡Conexión establecida exitosamente!');
      };
      
      eventSource.onmessage = (event) => {
        logger.log('📡 SSE TEST: Mensaje recibido:', event.data);
      };
      
      eventSource.onerror = (error) => {
        logger.error('❌ SSE TEST: Error:', error);
      };
      
    }, 1000);
  }, []);
  
  return (
    <div className="bg-black min-h-screen text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Prueba de Conexión SSE</h1>
      <p className="text-gray-300">Revisa la consola del navegador y los logs del servidor.</p>
      <p className="text-gray-300 mt-2">Esta página probará la conexión SSE en 1 segundo...</p>
    </div>
  );
}
