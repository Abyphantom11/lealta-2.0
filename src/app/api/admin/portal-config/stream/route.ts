import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const PORTAL_CONFIG_PATH = path.join(process.cwd(), 'portal-config.json');

// Mantener conexiones activas
const connections = new Set<ReadableStreamDefaultController>();
let lastModified = 0;

// Función para verificar cambios en el archivo
async function checkForUpdates(): Promise<boolean> {
  try {
    const stats = await fs.stat(PORTAL_CONFIG_PATH);
    const currentModified = stats.mtime.getTime();
    
    if (currentModified > lastModified) {
      lastModified = currentModified;
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Función para obtener la configuración actual
async function getCurrentConfig() {
  try {
    const data = await fs.readFile(PORTAL_CONFIG_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// Función para notificar a todos los clientes conectados
export async function notifyConfigChange() {
  console.log(`📡 Notificando cambios a ${connections.size} clientes conectados`);
  
  const config = await getCurrentConfig();
  if (!config) return;
  
  const message = `data: ${JSON.stringify({
    type: 'config-update',
    config,
    timestamp: Date.now()
  })}\n\n`;
  
  // Enviar a todos los clientes conectados
  connections.forEach(controller => {
    try {
      controller.enqueue(new TextEncoder().encode(message));
    } catch (error) {
      console.log('🗑️ Removiendo conexión inválida');
      connections.delete(controller);
    }
  });
}

export async function GET(request: NextRequest) {
  console.log('🔌 Nueva conexión SSE establecida');
  
  const stream = new ReadableStream({
    start(controller) {
      // Agregar a conexiones activas
      connections.add(controller);
      
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
        } catch (error) {
          clearInterval(heartbeatInterval);
          connections.delete(controller);
        }
      }, 30000);
      
      // Limpiar al cerrar conexión
      request.signal.addEventListener('abort', () => {
        console.log('🔌 Conexión SSE cerrada');
        clearInterval(heartbeatInterval);
        connections.delete(controller);
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
