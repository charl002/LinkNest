import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    formats: ['image/webp'],
    domains: ['cdn.bsky.app', 'webprojazure.blob.core.windows.net'],
  },
  experimental: {
    optimizePackageImports: ['@atproto/api'],
  },
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
