import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Increase dev-server on-demand compilation patience.
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 10,
  },

  webpack: (config, { dev }) => {
    if (dev) {
      // Use memory-based webpack cache in dev mode on Windows
      // to completely eliminate PackFileCacheStrategy file lock & rename race conditions
      config.cache = {
        type: "memory",
      };
    }
    return config;
  },
};

export default nextConfig;
