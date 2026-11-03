import { NextIntlClientProvider } from "next-intl";
import { ADMIN_TIME_ZONE } from "@/constants/admin";
import type { Locale } from "@/i18n/routing";
import { siteTextsOf } from "@/lib/siteTexts/catalog";
import { SITE_TEXT_KEYS } from "@/lib/siteTexts/server";
import de from "../../../messages/de.json";
import en from "../../../messages/en.json";
import { TextEditMode } from "./TextEditMode";

/**
 * The on-page text editor with what it needs: every default text in both
 * languages, and its own labels, which are English like the rest of the admin
 * (the page's messages carry edit markers and leave the admin's texts out).
 */
export function TextEditModeLoader({ locale }: { locale: Locale }) {
  return (
    <NextIntlClientProvider
      locale="en"
      messages={{ admin: { siteTexts: en.admin.siteTexts } }}
      timeZone={ADMIN_TIME_ZONE}
    >
      <TextEditMode keys={SITE_TEXT_KEYS} defaults={{ de: siteTextsOf(de), en: siteTextsOf(en) }} locale={locale} />
    </NextIntlClientProvider>
  );
}
