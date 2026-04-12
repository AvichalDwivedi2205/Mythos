import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
