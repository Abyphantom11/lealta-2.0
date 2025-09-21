// This file configures the initialization of Sentry for edge runtime.
// The config you add here will be used whenever a page or API route is going through the edge runtime.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Only capture errors in production
  enabled: process.env.NODE_ENV === 'production',
});
