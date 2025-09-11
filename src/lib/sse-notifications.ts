import { promises as fs } from 'fs';
import path from 'path';

const PORTAL_CONFIG_PATH = path.join(process.cwd(), 'portal-config.json');

// Mantener conexiones activas globalmente
const connections = new Set<ReadableStreamDefaultController>();

// Función para obtener la configuración actual
async function getCurrentConfig() {
  try {
    const data = await fs.readFile(PORTAL_CONFIG_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// Agregar conexión
export function addConnection(controller: ReadableStreamDefaultController) {
  connections.add(controller);
}

// Remover conexión
export function removeConnection(controller: ReadableStreamDefaultController) {
  connections.delete(controller);
}

// Función para notificar a todos los clientes conectados
export async function notifyConfigChange() {
  const config = await getCurrentConfig();
  if (!config) return;

  const message = `data: ${JSON.stringify({
    type: 'config-update',
    config,
    timestamp: Date.now(),
  })}\n\n`;

  // Enviar a todos los clientes conectados
  connections.forEach(controller => {
    try {
      controller.enqueue(new TextEncoder().encode(message));
    } catch {
      connections.delete(controller);
    }
  });
}

// Obtener configuración para uso interno
export { getCurrentConfig };
