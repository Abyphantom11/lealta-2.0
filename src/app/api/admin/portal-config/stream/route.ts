import { NextRequest, NextResponse } from 'next/server';
import {
  addConnection,
  removeConnection,
  getCurrentConfig,
} from '../../../../../lib/sse-notifications';
import { withAuth, AuthConfigs } from '../../../../../middleware/requireAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withAuth(request, async (session) => {
    console.log(`📡 Portal-config-stream GET by: ${session.role} (${session.userId}) - Business: ${session.businessId}`);
    
  const stream = new ReadableStream({
    start(controller) {
      // 🔒 BUSINESS ISOLATION: Agregar conexión específica del business
      addConnection(controller, session.businessId);

      // Enviar configuración inicial del business
      getCurrentConfig(session.businessId).then(config => {
        if (config) {
          const initialMessage = `data: ${JSON.stringify({
            type: 'initial-config',
            config,
            businessId: session.businessId,
            timestamp: Date.now(),
          })}\n\n`;

          controller.enqueue(new TextEncoder().encode(initialMessage));
        }
      });

      // Enviar heartbeat cada 30 segundos
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeat = `data: ${JSON.stringify({
            type: 'heartbeat',
            timestamp: Date.now(),
          })}\n\n`;

          controller.enqueue(new TextEncoder().encode(heartbeat));
        } catch {
          clearInterval(heartbeatInterval);
          removeConnection(controller, session.businessId);
        }
      }, 30000);

      // Limpiar al cerrar conexión
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        removeConnection(controller, session.businessId);
        controller.close();
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
  }, AuthConfigs.READ_ONLY);
}
