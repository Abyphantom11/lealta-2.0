/** @type {import('next').NextConfig} */
const nextConfig = {
  // Electron support
  output: process.env.NODE_ENV === 'production' && process.env.ELECTRON_BUILD ? 'export' : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // API routes won't work in static export, but we'll handle this conditionally
  experimental: {
    esmExternals: false,
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
  ],
};

module.exports = nextConfig;
