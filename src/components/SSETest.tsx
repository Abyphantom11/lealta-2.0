'use client';

import { useEffect } from 'react';

export function SSETest() {
  useEffect(() => {
    console.log('🧪 SSE TEST: Iniciando conexión...');
    
    const eventSource = new EventSource('/api/admin/portal-config/stream');
    
    eventSource.onopen = () => {
      console.log('✅ SSE TEST: ¡Conexión establecida exitosamente!');
    };
    
    eventSource.onmessage = (event) => {
      console.log('📡 SSE TEST: Mensaje recibido:', event.data);
    };
    
    eventSource.onerror = (error) => {
      console.error('❌ SSE TEST: Error:', error);
    };
    
    return () => {
      console.log('🔌 SSE TEST: Cerrando conexión');
      eventSource.close();
    };
  }, []);
  
  return null; // Componente invisible solo para testing
}
