/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com', 'ui-avatars.com'],
  },
  poweredByHeader: false,
  // Security headers for iframe embedding and CORS
  async headers() {
    // Get iframe allowed origins from environment or use defaults
    const iframeOrigins = process.env.IFRAME_ALLOWED_ORIGINS || 
      "'self' *.codecanyon.net *.envato.com *.envato-static.com localhost:* 127.0.0.1:*";
    
    const corsOrigin = process.env.CORS_ORIGIN || '*';
    
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'Content-Security-Policy',
            value: `frame-ancestors ${iframeOrigins}`
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: corsOrigin
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With'
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ],
      },
    ]
  },
  // Improved performance configuration
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error'],
    } : false,
  },
  // Re-enable experimental features one by one to identify the problematic one
  experimental: {
    // optimizeCss: true,
    scrollRestoration: true,
    // workerThreads: true,
    // optimisticClientCache: true
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig; 