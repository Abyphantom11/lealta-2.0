/**
 * 🔧 Configuración centralizada para Sistema de Tiempo Real
 * 
 * @description Configuración para SSE, Polling y eventos en tiempo real
 * @author GitHub Copilot
 * @date 2025-10-19
 */

export const REALTIME_CONFIG = {
  // 📡 Server-Sent Events Configuration
  sse: {
    enabled: true, // ✅ Activar/desactivar SSE globalmente
    endpoint: '/api/reservas/events', // 🔗 Endpoint SSE
    heartbeatInterval: 30000, // Heartbeat cada 30 segundos para mantener conexión
    reconnection: {
      delays: [3000, 6000, 12000, 24000, 48000], // Exponential backoff: 3s, 6s, 12s, 24s, 48s
      maxAttempts: 5, // Máximo 5 intentos antes de fallar
    },
  },
  
  // 🔄 Polling Fallback Configuration
  polling: {
    interval: 120000, // 2 minutos (reducido de 30 segundos)
    staleTime: 60000, // 1 minuto - datos fresh
    refetchOnWindowFocus: true, // ✅ Refetch cuando usuario vuelve a la app
    refetchOnMount: false, // ❌ NO refetch al montar - usar caché
  },
  
  // 📢 Event Types - Tipos de eventos que se emiten
  events: {
    // Eventos críticos (< 1s)
    QR_SCANNED: 'qr-scanned',
    ASISTENCIA_UPDATED: 'asistencia_updated',
    
    // Eventos importantes (< 5s)
    RESERVATION_CREATED: 'reservation-created',
    RESERVATION_UPDATED: 'reservation-updated',
    RESERVATION_DELETED: 'reservation-deleted',
    
    // Eventos normales (< 30s)
    STATUS_CHANGED: 'status-changed',
    
    // Eventos del sistema
    CONNECTED: 'connected',
    HEARTBEAT: 'heartbeat',
    ERROR: 'error',
  },
  
  // ⚙️ Performance Settings
  performance: {
    batchUpdates: true, // Agrupar múltiples actualizaciones
    batchDelay: 100, // 100ms para agrupar
    maxCacheSize: 1000, // Máximo 1000 reservas en caché
  },
  
  // 🐛 Debug Settings
  debug: {
    enabled: true, // ✅ Temporalmente habilitado para debugging
    logEvents: true,
    logReconnections: true,
    logCacheUpdates: false, // Muy verbose, desactivar en prod
  },
} as const;

// 📊 Helper para obtener configuración actual
export function getRealtimeConfig() {
  return REALTIME_CONFIG;
}

// 🔧 Helper para verificar si SSE está habilitado
export function isSSEEnabled(): boolean {
  return REALTIME_CONFIG.sse.enabled;
}

// 📝 Helper para logging condicional
export function debugLog(category: string, ...args: any[]) {
  if (REALTIME_CONFIG.debug.enabled) {
    console.log(`[Realtime:${category}]`, ...args);
  }
}
