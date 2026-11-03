import { notFound } from "next/navigation";
import * as rootParams from "next/root-params";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { storefrontMessages } from "@/lib/siteTexts/server";
import { routing } from "./routing";

/** The `[locale]` root param; undefined where there is none (the admin, Route Handlers). */
async function rootLocale(): Promise<string | undefined> {
  try {
    return await rootParams.locale();
  } catch {
    return undefined;
  }
}

/**
 * The locale comes from the `[locale]` root param, which keeps pages static
 * under Cache Components. Root params are not available in Route Handlers or
 * Server Actions — pass `locale` explicitly there (e.g. getTranslations({ locale })).
 */
export default getRequestConfig(async ({ locale: explicit }) => {
  const root = await rootLocale();
  // The admin root layout has no [locale] segment, so no root param: it is English.
  const locale = explicit ?? root ?? routing.defaultLocale;

  if (!hasLocale(routing.locales, locale)) notFound();

  const catalog = (await import(`../../messages/${locale}.json`)).default;
  return {
    locale,
    // Storefront renders show the texts changed in the admin; the admin keeps its own catalog.
    messages: root === undefined ? catalog : await storefrontMessages(catalog, locale),
  };
});
