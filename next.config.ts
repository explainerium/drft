import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Backend origin (server-only). The browser always calls /api/v1 on this
// domain and Next proxies it there.
const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:5005";

// On Vercel the localhost fallback can only fail, and only later, mid-prerender.
if (process.env.VERCEL && !process.env.API_ORIGIN) {
  throw new Error("Set API_ORIGIN (the backend URL, e.g. https://drft-server.vercel.app) in the Vercel project settings.");
}

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/api/v1/:path*", destination: `${API_ORIGIN}/api/v1/:path*` },
      // Locally stored uploads (STORAGE_DRIVER=local). With R2, images come from R2_PUBLIC_URL.
      { source: "/media/:path*", destination: `${API_ORIGIN}/media/:path*` },
    ];
  },
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  // Keep AGENTS.md out of the repo; `next dev` would otherwise create it.
  agentRules: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
