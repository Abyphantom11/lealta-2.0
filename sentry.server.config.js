// This file configures the initialization of Sentry on the server side.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Debug mode for development
  debug: process.env.NODE_ENV === "development",
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Enable only when DSN is configured
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Environment
  environment: process.env.NODE_ENV,
  
  beforeSend(event) {
    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Sentry Server:', event.exception?.values?.[0]?.value || event.message);
    }
    
    // Filter common server errors
    if (event.exception) {
      const error = event.exception.values?.[0];
      if (error?.value?.includes('ECONNRESET') || 
          error?.value?.includes('socket hang up')) {
        return null;
      }
    }
    
    // Remove sensitive data
    if (event.request?.headers) {
      delete event.request.headers.authorization;
      delete event.request.headers.cookie;
    }
    
    return event;
  },
});
