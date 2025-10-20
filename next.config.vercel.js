// next.config.js optimizations for Vercel
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimizaciones para Vercel
  experimental: {
    // Reducir el bundle size
    optimizePackageImports: ['@prisma/client', 'next-auth', 'date-fns'],
  },
  
  // Configuración de Serverless
  serverRuntimeConfig: {
    // 10 segundos de timeout máximo (plan Free de Vercel)
    timeout: 10000,
  },

  // Configuración de imágenes
  images: {
    domains: ['localhost', 'lealta.app'],
    unoptimized: process.env.NODE_ENV === 'development',
  },

  // Optimizar bundle
  swcMinify: true,
  
  // Optimizar compilación
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Headers para mejor performance
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
