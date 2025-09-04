/**
 * Servicio de logging para debugging y monitoreo
 * Proporciona diferentes niveles de log y puede integrarse con servicios externos
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: unknown;
}

// Configuración del logger
const config = {
  // Nivel mínimo que se mostrará - en producción suele ser 'info' o superior
  minLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  // Habilitar/deshabilitar completamente el logging
  enabled: true,
  // Colores para los diferentes niveles (solo en desarrollo)
  colors: {
    debug: '#6b7280',
    info: '#3b82f6',
    warn: '#f59e0b',
    error: '#ef4444',
    success: '#10b981',
  },
};

// Mapeo de niveles de log a valores numéricos para comparación
const logLevelMap: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  success: 1, // El nivel de éxito es equivalente a info en prioridad
};

/**
 * Determina si un nivel de log debe mostrarse según la configuración
 */
function shouldLog(level: LogLevel): boolean {
  if (!config.enabled) return false;
  return logLevelMap[level] >= logLevelMap[config.minLevel as LogLevel];
}

/**
 * Crea una entrada de log estructurada
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  data?: unknown
): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    data,
  };
}

/**
 * Guarda entrada de log (placeholder para futura integración con servicios)
 */
function saveLogEntry(_entry: LogEntry): void {
  // En el futuro aquí podríamos enviar logs a un servicio externo
  // Por ahora es solo un placeholder
}

/**
 * Log de debug - para información de desarrollo
 */
function debug(message: string, data?: unknown): void {
  if (shouldLog('debug')) {
    const entry = createLogEntry('debug', message, data);
    
    if (config.enabled) {
      console.debug(`🐛 [DEBUG] ${message}`, data || '');
    }
    
    saveLogEntry(entry);
  }
}

/**
 * Log de información general
 */
function info(message: string, data?: unknown): void {
  if (shouldLog('info')) {
    const entry = createLogEntry('info', message, data);
    
    if (config.enabled) {
      console.info(`ℹ️ [INFO] ${message}`, data || '');
    }
    
    saveLogEntry(entry);
  }
}

/**
 * Log de advertencias
 */
function warn(message: string, data?: unknown): void {
  if (shouldLog('warn')) {
    const entry = createLogEntry('warn', message, data);
    
    if (config.enabled) {
      console.warn(`⚠️ [WARN] ${message}`, data || '');
    }
    
    saveLogEntry(entry);
  }
}

/**
 * Log de errores
 */
function error(message: string, data?: unknown): void {
  if (shouldLog('error')) {
    const entry = createLogEntry('error', message, data);
    
    if (config.enabled) {
      console.error(`❌ [ERROR] ${message}`, data || '');
    }
    
    saveLogEntry(entry);
  }
}

/**
 * Log de éxito - para operaciones importantes completadas
 */
function success(message: string, data?: unknown): void {
  if (shouldLog('success')) {
    const entry = createLogEntry('success', message, data);
    
    if (config.enabled) {
      console.log(`✅ [SUCCESS] ${message}`, data || '');
    }
    
    saveLogEntry(entry);
  }
}

/**
 * Registra el tiempo de ejecución de una función
 */
function time<T>(name: string, fn: () => T): T {
  if (!shouldLog('debug')) return fn();

  console.time(`⏱️ ${name}`);
  const result = fn();
  console.timeEnd(`⏱️ ${name}`);
  return result;
}

/**
 * Registra el tiempo de ejecución de una función asíncrona
 */
async function timeAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  if (!shouldLog('debug')) return fn();

  console.time(`⏱️ ${name}`);
  const result = await fn();
  console.timeEnd(`⏱️ ${name}`);
  return result;
}

// Exportar el objeto logger completo para facilitar la importación
const logger = {
  debug,
  info,
  warn,
  error,
  success,
  time,
  timeAsync,
};

export default logger;
