import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/auth/:path*",
        destination: `${backendUrl}/auth/:path*`,
      },
      {
        source: "/audit/:path*",
        destination: `${backendUrl}/audit/:path*`,
      },
      {
        source: "/demo/:path*",
        destination: `${backendUrl}/demo/:path*`,
      },
      {
        source: "/events",
        destination: `${backendUrl}/events`,
      },
      {
        source: "/simulated-orders/:path*",
        destination: `${backendUrl}/simulated-orders/:path*`,
      },
      {
        source: "/ml/:path*",
        destination: `${backendUrl}/ml/:path*`,
      },
    ];
  },
};

export default nextConfig;
