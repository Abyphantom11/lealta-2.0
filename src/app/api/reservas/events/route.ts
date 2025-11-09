import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';

// Map para mantener las conexiones activas de SSE
const connections = new Map<string, ReadableStreamDefaultController>();

// Función helper para emitir eventos a todos los clientes conectados
export function emitReservationEvent(businessId: number, event: any) {
  const eventData = {
    ...event,
    businessId,
    timestamp: new Date().toISOString()
  };

  console.log('[SSE] Emitiendo evento:', eventData.type, 'para business:', businessId);

  let emittedCount = 0;
  for (const [connectionId, controller] of connections.entries()) {
    try {
      // Verificar que la conexión es del mismo business
      const [connBusinessId] = connectionId.split('-');
      if (Number.parseInt(connBusinessId) === businessId) {
        const message = `data: ${JSON.stringify(eventData)}\n\n`;
        controller.enqueue(new TextEncoder().encode(message));
        emittedCount++;
      }
    } catch (error) {
      console.error('[SSE] Error emitiendo a conexión:', connectionId, error);
      // Si hay error, remover la conexión
      connections.delete(connectionId);
    }
  }

  console.log(`[SSE] Evento emitido a ${emittedCount} conexiones`);
}

// Handler para OPTIONS (CORS preflight)
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(request: NextRequest) {
  // Verificar autenticación
  const session = await getServerSession(authOptions);
  
  console.log('[SSE] Verificando autenticación:', {
    hasSession: !!session,
    email: session?.user?.email,
    headers: {
      cookie: request.headers.get('cookie')?.substring(0, 50) + '...',
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer'),
    }
  });

  if (!session?.user?.email) {
    console.error('[SSE] ❌ No hay sesión válida');
    return new Response('Unauthorized', { status: 401 });
  }

  // Obtener businessId de los query params
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get('businessId');

  if (!businessId) {
    console.error('[SSE] ❌ businessId no proporcionado');
    return new Response('businessId required', { status: 400 });
  }

  console.log('[SSE] ✅ Nueva conexión para business:', businessId, 'usuario:', session.user.email);

  // Crear un ReadableStream para SSE
  const stream = new ReadableStream({
    start(controller) {
      // Generar ID único para esta conexión
      const connectionId = `${businessId}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      connections.set(connectionId, controller);

      console.log(`[SSE] Conexión ${connectionId} establecida. Total conexiones: ${connections.size}`);

      // Enviar evento de conexión inicial
      const connectEvent = {
        type: 'connected',
        message: 'Conexión SSE establecida',
        connectionId
      };
      controller.enqueue(
        new TextEncoder().encode(`data: ${JSON.stringify(connectEvent)}\n\n`)
      );

      // Configurar heartbeat cada 30 segundos
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeat = {
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          };
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify(heartbeat)}\n\n`)
          );
        } catch (error) {
          console.error('[SSE] Error en heartbeat:', error);
          clearInterval(heartbeatInterval);
          connections.delete(connectionId);
        }
      }, 30000);

      // Limpiar al cerrar
      request.signal.addEventListener('abort', () => {
        console.log(`[SSE] Conexión ${connectionId} cerrada por cliente. Total conexiones: ${connections.size - 1}`);
        clearInterval(heartbeatInterval);
        connections.delete(connectionId);
        try {
          controller.close();
        } catch {
          // Ignorar errores al cerrar
        }
      });
    },
  });

  // Retornar response con headers SSE y CORS
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Para Nginx
      'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
