// eslint-disable-next-line @typescript-eslint/no-require-imports
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
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
  
  // Allow cross-origin requests from the local network and Cloudflare tunnel
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
    'came-carried-dive-drum.trycloudflare.com',
    '*.trycloudflare.com',
  ],
  
  // Headers for security and performance
  async headers() {
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
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
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
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
