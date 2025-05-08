const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  optimizeFonts: false,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_NEO4J_URI: process.env.NEXT_PUBLIC_NEO4J_URI,
    NEXT_PUBLIC_NEO4J_USERNAME: process.env.NEXT_PUBLIC_NEO4J_USERNAME,
    NEXT_PUBLIC_NEO4J_PASSWORD: process.env.NEXT_PUBLIC_NEO4J_PASSWORD
  },
  transpilePackages: ['vis-network'],
  webpack: (config, { isServer }) => {
    config.cache = { type: 'memory' }
    return config
  },
};

module.exports = withBundleAnalyzer(nextConfig);