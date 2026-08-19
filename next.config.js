/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Skip static page generation during build (fixes Railway build issues)
  output: 'standalone',
  
  // Disable ESLint during production builds (warnings treated as errors)
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript build errors for production
  typescript: {
    ignoreBuildErrors: false, // Keep this false to catch real errors
  },
  
  // Performance optimizations
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Experimental features for better performance
  experimental: {
    // optimizeCss: true, // Disabled - causes 'critters' module error on Railway
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      // NOTE: Do not override splitChunks here - forcing all of node_modules into a
      // single 'vendor' chunk made public pages download dashboard-only deps
      // (recharts, react-quill, etc.). Next's default chunking splits per-route.
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
      }
    }
    return config
  },
  
  // Enable compression
  compress: true,
  
  // Faster refreshes in dev
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
}

module.exports = nextConfig
