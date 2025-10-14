// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://279dffa541feca85b97b3d15fa4ec6f4@o4509716657405953.ingest.us.sentry.io/4510057803546624",

  // 🚀 OPTIMIZADO PARA PRODUCCIÓN: Solo 10% de traces para reducir costos
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,

  // 🎯 SAMPLING INTELIGENTE: Más traces para errores críticos
  tracesSampler: (samplingContext: any) => {
    // Siempre tracear errores críticos
    if (samplingContext.request?.url?.includes('/api/auth/') || 
        samplingContext.request?.url?.includes('/api/business/')) {
      return 0.5; // 50% para rutas críticas
    }
    
    // Menos traces para assets estáticos
    if (samplingContext.request?.url?.includes('/_next/static/')) {
      return 0.01; // 1% para assets
    }
    
    return process.env.NODE_ENV === 'production' ? 0.1 : 1;
  },

  // 🎛️ LOGS OPTIMIZADOS: Solo errores en producción
  beforeSend: (event: any) => {
    // Filtrar logs innecesarios en producción
    if (process.env.NODE_ENV === 'production' && event.level === 'info') {
      return null;
    }
    return event;
  },

  // Enable logs to be sent to Sentry
  enableLogs: process.env.NODE_ENV !== 'production',

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false, // Deshabilitado para evitar problemas con bundles optimizados
});
