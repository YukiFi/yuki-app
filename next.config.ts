import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pino", "thread-stream", "@walletconnect/logger"],
};

export default nextConfig;
