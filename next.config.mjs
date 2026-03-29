/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000,
    deviceSizes: [320, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  swcMinify: true,
  compress: true,
  productionBrowserSourceMaps: false,
  reactStrictMode: false,
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        radix: {
          test: /@radix-ui/,
          name: 'radix',
          priority: 10,
          reuseExistingChunk: true,
          enforce: true,
        },
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react-vendors',
          priority: 10,
          reuseExistingChunk: true,
          enforce: true,
        },
      };
    }
    return config;
  },
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=3600' },
      ],
    },
    {
      source: '/static/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
  ],
}

export default nextConfig
