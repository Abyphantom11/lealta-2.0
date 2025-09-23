/**
 * 🔇 Logger optimizado para producción
 * Silencia automáticamente los logs en producción para ahorrar CPU
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogOptions {
  force?: boolean; // Forzar log incluso en producción
  level?: LogLevel;
}

class ProductionOptimizedLogger {
  private readonly isDevelopment = process.env.NODE_ENV === 'development';

  info(message: string, data?: any, options?: LogOptions) {
    if (this.shouldLog(options)) {
      console.log(`ℹ️ ${message}`, data ?? '');
    }
  }

  warn(message: string, data?: any, options?: LogOptions) {
    if (this.shouldLog(options) || options?.level === 'warn') {
      console.warn(`⚠️ ${message}`, data ?? '');
    }
  }

  error(message: string, data?: any) {
    // Errores SIEMPRE se loggean
    console.error(`❌ ${message}`, data ?? '');
  }

  debug(message: string, data?: any, options?: LogOptions) {
    if (this.isDevelopment && this.shouldLog(options)) {
      console.log(`🐛 ${message}`, data ?? '');
    }
  }

  // Para APIs críticas que necesitan logging en prod
  critical(message: string, data?: any) {
    console.log(`🚨 [CRITICAL] ${message}`, data ?? '');
  }

  private shouldLog(options?: LogOptions): boolean {
    return this.isDevelopment || options?.force === true;
  }
}

export const logger = new ProductionOptimizedLogger();

// Función legacy para migración gradual
export const log = (message: string, data?: any) => {
  logger.info(message, data);
};
