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
    return config;
  },
  
  images: {
    unoptimized: false,
    formats: ['image/webp'],
  },
  
  output: 'standalone',
};

module.exports = nextConfig;
