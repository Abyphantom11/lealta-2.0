// This file configures the initialization of Sentry for the browser side.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Debug solo en desarrollo local específico
  debug: false, // Deshabilitado para evitar problemas con bundles optimizados
  
  // Sample rate - importante para producción
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // Siempre habilitado si hay DSN
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Environment
  environment: process.env.NODE_ENV || "development",
  
  // Configuración personalizada
  beforeSend(event: any) {
    // Log en desarrollo
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 Sentry Client - Enviando evento:", {
        message: event.message,
        level: event.level,
        exception: event.exception?.values?.[0]?.value,
        timestamp: new Date().toISOString()
      });
    }
    return event;
  },
});
