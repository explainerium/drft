import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { SiteTextsView } from "@/components/dashboard/content/SiteTextsView";
import { StaffOnly } from "@/components/dashboard/StaffOnly";
import { ADMIN_LOCALE } from "@/constants/admin";
import { siteTextsOf } from "@/lib/siteTexts/catalog";
import de from "../../../../../messages/de.json";
import en from "../../../../../messages/en.json";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: ADMIN_LOCALE, namespace: "admin.metadata" });
  return { title: t("siteTexts") };
}

// The defaults come from the message files; what was changed comes from the API in the browser.
// `?key=` is read in the browser, which a prerender cannot know.
export default function AdminSiteTextsPage() {
  return (
    <StaffOnly>
      <Suspense>
        <SiteTextsView defaults={{ de: siteTextsOf(de), en: siteTextsOf(en) }} />
      </Suspense>
    </StaffOnly>
  );
}
