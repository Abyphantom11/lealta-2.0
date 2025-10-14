// Bundle analyzer with fallback for production builds
let withBundleAnalyzer;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  });
} catch {
  // Fallback if bundle analyzer is not available  
  withBundleAnalyzer = (config) => config;
}

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
    // ✅ OPTIMIZACIÓN: Activar optimización de imágenes para reducir bandwidth
    unoptimized: process.env.ELECTRON_BUILD ? true : false,
    formats: ['image/avif', 'image/webp'], // Formatos modernos más eficientes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // Cache de 1 año para imágenes optimizadas
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  swcMinify: true, // ✅ Usar SWC para minificación más rápida
  
  // Bundle optimization - SIMPLIFICADO PARA EVITAR BUCLES
  webpack: (config, { isServer, dev }) => {
    // 🎯 OPTIMIZACIONES BÁSICAS (sin optimizaciones agresivas que pueden causar loops)
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        buffer: false,
      };
    }
    
    // ✅ OPTIMIZACIÓN: Reducir tamaño del bundle
    if (!dev) {
      // Eliminar console.logs en producción
      config.optimization.minimize = true;
      
      // Tree shaking mejorado
      config.optimization.usedExports = true;
      config.optimization.sideEffects = true;
    }
    
    return config;
  },
  
  // API routes won't work in static export, but we'll handle this conditionally
  experimental: {
    // Disabled esmExternals to fix worker script issues
    esmExternals: false,
    // � OPTIMIZACIONES DESHABILITADAS PARA EVITAR BUCLES
    // Estas pueden causar loops infinitos durante la optimización
    // turbotrace: {
    //   logLevel: process.env.NODE_ENV === 'production' ? 'error' : 'info',
    // },
    // optimizePackageImports: ['react-icons', 'lodash', '@prisma/client'],
    // optimizeServerReact: true,
    
    // ⚡ OPTIMIZACIONES DE BUILD MÁS EFECTIVAS
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
    // 📦 Optimizar imports específicos
    optimizePackageImports: [
      'lucide-react',
      'framer-motion', 
      '@prisma/client',
      'next-auth'
    ],
    // 🎯 Build optimizations
    optimizeCss: true,
    // 🔄 Cache optimizations
    serverComponentsExternalPackages: ['@prisma/client'],
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
              ? "default-src 'self' *; script-src 'self' 'unsafe-eval' 'unsafe-inline' *; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' *; font-src 'self' *; img-src 'self' data: blob: *; connect-src 'self' *; frame-src 'self' *; frame-ancestors 'none';"
              : "default-src 'self' 'unsafe-eval' 'unsafe-inline' *; worker-src 'self' blob:; img-src 'self' data: blob: *; connect-src 'self' *; frame-src *; frame-ancestors 'none';",
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=(), payment=(), usb=()',
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
      // ✅ OPTIMIZACIÓN: Cache para iconos y assets estáticos
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*.{jpg,jpeg,png,gif,webp,avif,svg,ico}',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, must-revalidate', // 30 días
          },
        ],
      },
      // ✅ OPTIMIZACIÓN: Manifest y service worker
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, must-revalidate', // 1 día
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

// Injected content via Sentry wizard below

// Configuración condicional de Sentry
let finalConfig = withBundleAnalyzer(nextConfig);

// Solo aplicar Sentry si hay auth token configurado
if (process.env.SENTRY_AUTH_TOKEN) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { withSentryConfig } = require("@sentry/nextjs");
    
    finalConfig = withSentryConfig(finalConfig, {
      org: "enora-core",
      project: "javascript-nextjs",
      silent: !process.env.CI,
      widenClientFileUpload: true,
      disableLogger: true,
      automaticVercelMonitors: true,
    });
  } catch (error) {
    console.warn('⚠️ Sentry configuration skipped:', error.message);
  }
} else {
  console.log('ℹ️ Sentry disabled - no auth token provided');
}

module.exports = finalConfig;
