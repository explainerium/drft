import type { NextConfig } from "next";

// Backend origin (server-only). The browser always calls /api/v1 on this
// domain and Next proxies it there — see PLAN.md §4.
const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:5000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${API_ORIGIN}/api/v1/:path*` }];
  },
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
