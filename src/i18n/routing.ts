import { defineRouting } from "next-intl/routing";

/**
 * English only at launch. Adding a language later is: add it here,
 * add messages/<locale>.json. The default locale has no URL prefix.
 */
export const routing = defineRouting({
  locales: ["en"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
