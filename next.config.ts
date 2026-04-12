import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  logging: {
    fetches: {
      fullUrl: true,
    },
    serverFunctions: true,
    browserToTerminal: "warn",
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
