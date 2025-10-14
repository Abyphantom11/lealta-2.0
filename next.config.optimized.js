/** @type {import('next').NextConfig} */
const nextConfig = {
  // ⚡ Optimizaciones de build
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // 🎯 Optimizaciones de desarrollo
  reactStrictMode: true,
  
  // 📦 Optimizaciones de bundle
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  
  // 🔄 Cache y build
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // 📁 Optimizaciones de archivos
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  
  // 🚀 Build output
  output: 'standalone',
  
  // 🎪 Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks.chunks = 'all';
    }
    return config;
  },
};

module.exports = nextConfig;