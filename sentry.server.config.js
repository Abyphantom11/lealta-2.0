// This file configures the initialization of Sentry on the server side.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Only capture errors in production
  enabled: process.env.NODE_ENV === 'production',
  
  // Performance monitoring
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],
  
  beforeSend(event) {
    // Filter out development errors and sensitive data
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    
    // Remove sensitive information
    if (event.request?.headers) {
      delete event.request.headers.authorization;
      delete event.request.headers.cookie;
    }
    
    return event;
  },
});
