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
};

module.exports = nextConfig;
