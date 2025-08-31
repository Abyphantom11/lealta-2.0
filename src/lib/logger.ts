/**
 * Servicio de logging para debugging y monitoreo
 * Proporciona diferentes niveles de log y puede integrarse con servicios externos
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: any;
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
function createLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    data,
  };
}

/**
 * Formatea un mensaje de log para la consola
 */
function formatLogMessage(entry: LogEntry): string {
  const { level, message, timestamp } = entry;
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
}

/**
 * Registra un mensaje de depuración (nivel más bajo)
 */
export function debug(message: string, data?: any): void {
  if (!shouldLog('debug')) return;
  
  const entry = createLogEntry('debug', message, data);
  console.debug(
    `%c${formatLogMessage(entry)}`,
    `color: ${config.colors.debug}`,
    data || ''
  );
}

/**
 * Registra un mensaje informativo
 */
export function info(message: string, data?: any): void {
  if (!shouldLog('info')) return;
  
  const entry = createLogEntry('info', message, data);
  console.info(
    `%c${formatLogMessage(entry)}`,
    `color: ${config.colors.info}`,
    data || ''
  );
}

/**
 * Registra una advertencia
 */
export function warn(message: string, data?: any): void {
  if (!shouldLog('warn')) return;
  
  const entry = createLogEntry('warn', message, data);
  console.warn(
    `%c${formatLogMessage(entry)}`,
    `color: ${config.colors.warn}`,
    data || ''
  );
}

/**
 * Registra un error
 */
export function error(message: string, data?: any): void {
  if (!shouldLog('error')) return;
  
  const entry = createLogEntry('error', message, data);
  console.error(
    `%c${formatLogMessage(entry)}`,
    `color: ${config.colors.error}`,
    data || ''
  );
}

/**
 * Registra un mensaje de éxito (mismo nivel que info)
 */
export function success(message: string, data?: any): void {
  if (!shouldLog('success')) return;
  
  const entry = createLogEntry('success', message, data);
  console.info(
    `%c${formatLogMessage(entry)}`,
    `color: ${config.colors.success}`,
    data || ''
  );
}

/**
 * Registra el tiempo de ejecución de una función
 */
export function time<T>(name: string, fn: () => T): T {
  if (!shouldLog('debug')) return fn();
  
  console.time(`⏱️ ${name}`);
  const result = fn();
  console.timeEnd(`⏱️ ${name}`);
  return result;
}

/**
 * Registra el tiempo de ejecución de una función asíncrona
 */
export async function timeAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  if (!shouldLog('debug')) return fn();
  
  console.time(`⏱️ ${name}`);
  const result = await fn();
  console.timeEnd(`⏱️ ${name}`);
  return result;
}

// Exportar el objeto logger completo para facilitar la importación
export default {
  debug,
  info,
  warn,
  error,
  success,
  time,
  timeAsync,
};
