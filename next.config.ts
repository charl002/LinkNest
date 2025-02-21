import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allow all hostnames
      },
    ],
  },
  env: {
    PORT: process.env.PORT || "8080",
  },
};

export default nextConfig;
