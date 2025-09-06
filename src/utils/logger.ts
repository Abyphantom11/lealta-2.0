// Utilidad de logging que solo funciona en desarrollo
class Logger {
  private readonly isDev: boolean = process.env.NODE_ENV === 'development';

  log(...args: any[]): void {
    if (this.isDev) {
      console.log(...args);
    }
  }

  warn(...args: any[]): void {
    if (this.isDev) {
      console.warn(...args);
    }
  }

  error(...args: any[]): void {
    if (this.isDev) {
      console.error(...args);
    }
  }

  info(...args: any[]): void {
    if (this.isDev) {
      console.info(...args);
    }
  }

  debug(...args: any[]): void {
    if (this.isDev) {
      console.debug(...args);
    }
  }
}

// Instancia global
export const logger = new Logger();

// También exportar como default para flexibilidad
export default logger;
