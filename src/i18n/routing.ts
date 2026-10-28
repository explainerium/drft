import { defineRouting } from "next-intl/routing";

/**
 * German first (no URL prefix), English under /en. The browser language is not
 * used to redirect: "/" is always German, and the header switch changes it.
 * Another language is: add it here and add messages/<locale>.json.
 */
export const routing = defineRouting({
  locales: ["de", "en"],
  defaultLocale: "de",
  localePrefix: "as-needed",
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
