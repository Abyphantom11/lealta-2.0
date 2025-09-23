import { promises as fs } from 'fs';
import path from 'path';

// 🔒 BUSINESS ISOLATION: Configuración por business
function getPortalConfigPath(businessId: string): string {
  return path.join(process.cwd(), 'config', 'portal', `portal-config-${businessId}.json`);
}

// Mantener conexiones activas por business
const connectionsByBusiness = new Map<string, Set<ReadableStreamDefaultController>>();

// Función para obtener la configuración actual POR BUSINESS
async function getCurrentConfig(businessId: string) {
  try {
    const configPath = getPortalConfigPath(businessId);
    const data = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// 🔒 BUSINESS ISOLATION: Gestión de conexiones por business
export function addConnection(controller: ReadableStreamDefaultController, businessId: string) {
  if (!connectionsByBusiness.has(businessId)) {
    connectionsByBusiness.set(businessId, new Set());
  }
  connectionsByBusiness.get(businessId)!.add(controller);
}

export function removeConnection(controller: ReadableStreamDefaultController, businessId: string) {
  const businessConnections = connectionsByBusiness.get(businessId);
  if (businessConnections) {
    businessConnections.delete(controller);
    // Limpiar si no hay más conexiones
    if (businessConnections.size === 0) {
      connectionsByBusiness.delete(businessId);
    }
  }
}

// 🔒 BUSINESS ISOLATION: Notificar solo al business específico
export async function notifyConfigChange(businessId: string) {
  const config = await getCurrentConfig(businessId);
  if (!config) return;

  const message = `data: ${JSON.stringify({
    type: 'config-update',
    config,
    businessId,
    timestamp: Date.now(),
  })}\n\n`;

  // Enviar solo a las conexiones del business específico
  const businessConnections = connectionsByBusiness.get(businessId);
  if (!businessConnections) return;

  businessConnections.forEach(controller => {
    try {
      controller.enqueue(new TextEncoder().encode(message));
    } catch {
      businessConnections.delete(controller);
    }
  });
}

// Obtener configuración para uso interno
export { getCurrentConfig };
