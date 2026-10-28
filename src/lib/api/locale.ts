import "server-only";
import { hasLocale } from "next-intl";
import * as rootParams from "next/root-params";
import { routing, type Locale } from "@/i18n/routing";

/** The storefront language of this render. Outside [locale] (sitemap, admin) it is German. */
export async function requestLocale(): Promise<Locale> {
  try {
    const locale = await rootParams.locale();
    return hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  } catch {
    return routing.defaultLocale;
  }
}
