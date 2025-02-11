import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "webprojazure.blob.core.windows.net",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  env: {
    PORT: process.env.PORT || "8080",
  },
};

export default nextConfig;
