import type { MetadataRoute } from "next";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3005").replace(/\/$/, "");

/** Crawlers may read the shop and content, not the admin, accounts, cart, checkout or the API. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/account", "/cart", "/checkout", "/api/", "/newsletter/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
