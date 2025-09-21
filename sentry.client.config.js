// This file configures the initialization of Sentry on the browser side.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Debug mode for development
  debug: process.env.NODE_ENV === "development",
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session Replay - disabled for now to avoid issues
  // replaysSessionSampleRate: 0.1, // 10% of sessions
  // replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
  
  // Enable only when DSN is configured
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Custom configuration
  beforeSend(event) {
    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
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
