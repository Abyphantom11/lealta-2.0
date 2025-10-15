/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración mínima para builds rápidos
  typescript: {
    ignoreBuildErrors: true,
  },
  
  experimental: {
    // Solo optimizaciones que funcionan bien
    optimizePackageImports: [
      'lucide-react',
      'date-fns'
    ],
    optimizeCss: true,
    swcMinify: true,
  },
  
  // Webpack mínimo
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        os: false,
      };
    }
    
    // ⚠️ Suprimir warnings de OpenTelemetry/Prisma instrumentation
    config.ignoreWarnings = [
      {
        module: /@prisma\/instrumentation/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
      {
        module: /@opentelemetry\/instrumentation/,
        message: /Critical dependency: the request of a dependency is an expression/,
      }
    ];
    
    return config;
  },
  
  images: {
    unoptimized: false,
    formats: ['image/webp'],
  },
  
  // 🔄 CLOUDFLARE QR LEGACY SUPPORT - Interceptar URL que va a morir
  async rewrites() {
    return [
      // Interceptar solicitudes específicas de Cloudflare QR legacy
      {
        source: '/cloudflare-qr-legacy',
        destination: '/api/cloudflare-qr-legacy'
      }
    ];
  },
  
  // Headers para manejar solicitudes cross-origin del QR legacy
  async headers() {
    return [
      {
        source: '/api/cloudflare-qr-legacy',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization'
          },
          {
            key: 'X-Legacy-QR-Support',
            value: 'cloudflare-tunnel-migration'
          }
        ]
      }
    ];
  },

  output: 'standalone',
};

module.exports = nextConfig;
