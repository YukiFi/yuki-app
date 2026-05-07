import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pino", "thread-stream", "@walletconnect/logger"],
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "pino-pretty": false,
    };
    return config;
  },
};

export default nextConfig;
