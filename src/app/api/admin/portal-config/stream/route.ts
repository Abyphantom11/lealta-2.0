import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../../../../../utils/logger';
import { addConnection, removeConnection, getCurrentConfig } from '../../../../../lib/sse-notifications';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  logger.log('🔌 Nueva conexión SSE establecida');
  
  const stream = new ReadableStream({
    start(controller) {
      // Agregar a conexiones activas
      addConnection(controller);
      
      // Enviar configuración inicial
      getCurrentConfig().then(config => {
        if (config) {
          const initialMessage = `data: ${JSON.stringify({
            type: 'initial-config',
            config,
            timestamp: Date.now()
          })}\n\n`;
          
          controller.enqueue(new TextEncoder().encode(initialMessage));
        }
      });
      
      // Enviar heartbeat cada 30 segundos
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeat = `data: ${JSON.stringify({
            type: 'heartbeat',
            timestamp: Date.now()
          })}\n\n`;
          
          controller.enqueue(new TextEncoder().encode(heartbeat));
        } catch {
          clearInterval(heartbeatInterval);
          removeConnection(controller);
        }
      }, 30000);
      
      // Limpiar al cerrar conexión
      request.signal.addEventListener('abort', () => {
        logger.log('🔌 Conexión SSE cerrada');
        clearInterval(heartbeatInterval);
        removeConnection(controller);
        controller.close();
      });
    },
  });
  
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}
