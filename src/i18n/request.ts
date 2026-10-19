import { notFound } from "next/navigation";
import * as rootParams from "next/root-params";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

/**
 * The locale comes from the `[locale]` root param, which keeps pages static
 * under Cache Components. Root params are not available in Route Handlers or
 * Server Actions — pass `locale` explicitly there (e.g. getTranslations({ locale })).
 */
export default getRequestConfig(async ({ locale: explicit }) => {
  // The admin root layout has no [locale] segment, so no root param: it is English.
  const locale = explicit ?? (await rootParams.locale()) ?? routing.defaultLocale;

  if (!hasLocale(routing.locales, locale)) notFound();

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
