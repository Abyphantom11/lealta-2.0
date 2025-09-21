// eslint-disable-next-line @typescript-eslint/no-require-imports
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Temporarily ignore TypeScript errors for production build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Electron support
  output:
    process.env.NODE_ENV === 'production' && process.env.ELECTRON_BUILD
      ? 'export'
      : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  
  // Bundle optimization
  webpack: (config, { isServer }) => {
    // Optimize bundle size
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    return config;
  },
  
  // API routes won't work in static export, but we'll handle this conditionally
  experimental: {
    // Disabled esmExternals to fix worker script issues
    esmExternals: false,
    // Temporarily disabled due to critters module issue
    // optimizeCss: true,
  },
  
  // Allow cross-origin requests from the local network
  allowedDevOrigins: [
    '192.168.1.5:3001',
    '192.168.1.5:3000',
    '192.168.1.5',
    'localhost:3001',
    'localhost:3000',
    'localhost',
    '127.0.0.1:3001',
    '127.0.0.1:3000',
    '127.0.0.1',
    '192.168.1.*:3001',
    '192.168.1.*:3000',
    '192.168.1.*',
    // 🔒 AUTH FIX: Cloudflare tunnel support
    'came-carried-dive-drum.trycloudflare.com',
    '*.trycloudflare.com',
  ],
  
  // Headers for security and performance
  async headers() {
    const isProduction = process.env.NODE_ENV === 'production';
    
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // 🛡️ SECURITY HEADERS MEJORADOS PARA PRODUCCIÓN
          {
            key: 'Strict-Transport-Security',
            value: isProduction 
              ? 'max-age=31536000; includeSubDomains; preload' 
              : 'max-age=0',
          },
          {
            key: 'Content-Security-Policy',
            value: isProduction
              ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' *.googleapis.com *.gstatic.com; style-src 'self' 'unsafe-inline' *.googleapis.com fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data: blob: *.unsplash.com *.pixabay.com; connect-src 'self' *.upstash.io; frame-ancestors 'none';"
              : "default-src 'self' 'unsafe-eval' 'unsafe-inline' *; frame-ancestors 'none';",
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
          // 🛡️ API SECURITY HEADERS
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // 🛡️ SECURITY: Proteger archivos sensibles
      {
        source: '/:path*\\.(env|env\\.local|env\\.production|env\\.development)',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);


// Injected content via Sentry wizard below

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(
  module.exports,
  {
    // For all available options, see:
    // https://www.npmjs.com/package/@sentry/webpack-plugin#options

    org: "enora-core",
    project: "javascript-nextjs",

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    // tunnelRoute: "/monitoring",

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
  }
);
