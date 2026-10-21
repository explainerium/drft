import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FaqView } from "@/components/dashboard/content/FaqView";
import { StaffOnly } from "@/components/dashboard/StaffOnly";
import { ADMIN_LOCALE } from "@/constants/admin";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: ADMIN_LOCALE, namespace: "admin.metadata" });
  return { title: t("faq") };
}

export default function AdminFaqPage() {
  return (
    <StaffOnly>
      <FaqView />
    </StaffOnly>
  );
}
