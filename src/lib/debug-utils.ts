/**
 * 🔇 UTILIDAD PARA LOGS DE PRODUCCIÓN
 * Elimina logs automáticamente en producción para reducir spam
 */

// Solo mostrar logs en desarrollo
const isDevelopment = process.env.NODE_ENV === 'development';

export const debugLog = (...args: any[]) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

export const debugError = (...args: any[]) => {
  if (isDevelopment) {
    console.error(...args);
  }
};

export const debugWarn = (...args: any[]) => {
  if (isDevelopment) {
    console.warn(...args);
  }
};
