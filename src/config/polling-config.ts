/**
 * Configuración centralizada para polling y exponential backoff
 * ENHANCED v2.3: Parámetros optimizados por tipo de componente
 */

export interface PollingConfig {
  baseInterval: number;
  maxInterval: number;
  backoffMultiplier: number;
  maxConsecutiveFailures: number;
  enableBackoff: boolean;
}

/**
 * Configuraciones predefinidas por tipo de componente
 */
export const POLLING_CONFIGS = {
  // Para datos críticos del usuario (reservas, cliente)
  CRITICAL_USER_DATA: {
    baseInterval: 30000, // 30 segundos
    maxInterval: 120000, // 2 minutos máximo
    backoffMultiplier: 2,
    maxConsecutiveFailures: 3,
    enableBackoff: true
  } as PollingConfig,

  // Para datos del cliente en tiempo real
  CLIENT_REALTIME: {
    baseInterval: 15000, // 15 segundos
    maxInterval: 60000, // 1 minuto máximo
    backoffMultiplier: 1.5, // Backoff más suave
    maxConsecutiveFailures: 2, // Más sensible
    enableBackoff: true
  } as PollingConfig,

  // Para datos administrativos
  ADMIN_DATA: {
    baseInterval: 30000, // 30 segundos
    maxInterval: 180000, // 3 minutos máximo
    backoffMultiplier: 2,
    maxConsecutiveFailures: 4, // Más tolerante
    enableBackoff: true
  } as PollingConfig,

  // Para notificaciones y estado del sistema
  SYSTEM_STATUS: {
    baseInterval: 10000, // 10 segundos
    maxInterval: 60000, // 1 minuto máximo
    backoffMultiplier: 2,
    maxConsecutiveFailures: 5, // Muy tolerante
    enableBackoff: true
  } as PollingConfig,

  // Para configuración del portal (menos crítico)
  PORTAL_CONFIG: {
    baseInterval: 120000, // 2 minutos
    maxInterval: 600000, // 10 minutos máximo
    backoffMultiplier: 2,
    maxConsecutiveFailures: 3,
    enableBackoff: true
  } as PollingConfig,

  // Para casos donde no queremos backoff
  SIMPLE_POLLING: {
    baseInterval: 30000,
    maxInterval: 30000,
    backoffMultiplier: 1,
    maxConsecutiveFailures: 999,
    enableBackoff: false
  } as PollingConfig
} as const;

/**
 * Función helper para crear configuraciones personalizadas
 */
export function createPollingConfig(
  baseConfig: PollingConfig,
  overrides: Partial<PollingConfig>
): PollingConfig {
  return {
    ...baseConfig,
    ...overrides
  };
}

/**
 * Configuraciones específicas por contexto de negocio
 */
export const BUSINESS_CONTEXT_CONFIGS = {
  // Para asignaciones manuales recientes (más frecuente)
  MANUAL_ASSIGNMENT: createPollingConfig(POLLING_CONFIGS.CLIENT_REALTIME, {
    baseInterval: 15000, // 15 segundos
    maxInterval: 45000   // 45 segundos máximo
  }),

  // Para operaciones normales
  NORMAL_OPERATION: createPollingConfig(POLLING_CONFIGS.CLIENT_REALTIME, {
    baseInterval: 60000, // 1 minuto
    maxInterval: 180000  // 3 minutos máximo
  }),

  // Para modo de desarrollo (más frecuente para testing)
  DEVELOPMENT: createPollingConfig(POLLING_CONFIGS.CRITICAL_USER_DATA, {
    baseInterval: 10000, // 10 segundos
    maxInterval: 30000,  // 30 segundos máximo
    maxConsecutiveFailures: 2
  })
} as const;

/**
 * Función para obtener configuración basada en el entorno
 */
export function getEnvironmentConfig(baseConfig: PollingConfig): PollingConfig {
  if (process.env.NODE_ENV === 'development') {
    return createPollingConfig(baseConfig, {
      baseInterval: Math.max(baseConfig.baseInterval * 0.5, 5000), // Más rápido en dev
      maxConsecutiveFailures: Math.max(baseConfig.maxConsecutiveFailures - 1, 1)
    });
  }
  
  return baseConfig;
}