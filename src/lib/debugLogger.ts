/**
 * Debug Logger para entorno de desarrollo
 * Permite activar/desactivar logs fácilmente
 */

const DEBUG_ENABLED = false; // 🔧 Cambiar a true para activar logs en desarrollo

class DebugLogger {
  private enabled: boolean;

  constructor(enabled: boolean = DEBUG_ENABLED) {
    this.enabled = enabled;
  }

  log(...args: any[]) {
    if (this.enabled) {
      console.log(...args);
    }
  }

  info(...args: any[]) {
    if (this.enabled) {
      console.info(...args);
    }
  }

  warn(...args: any[]) {
    if (this.enabled) {
      console.warn(...args);
    }
  }

  error(...args: any[]) {
    // Los errores siempre se muestran
    console.error(...args);
  }

  debug(...args: any[]) {
    if (this.enabled) {
      console.debug(...args);
    }
  }

  // Método para logs críticos que siempre se muestran
  critical(...args: any[]) {
    console.log(...args);
  }
}

// Instancia global del logger
export const logger = new DebugLogger();

// Logger específico para desarrollo
export const devLogger = new DebugLogger(process.env.NODE_ENV === 'development' && DEBUG_ENABLED);

export default logger;
