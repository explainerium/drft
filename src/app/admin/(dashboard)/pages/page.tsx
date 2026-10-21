import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PagesView } from "@/components/dashboard/content/ContentLists";
import { StaffOnly } from "@/components/dashboard/StaffOnly";
import { ADMIN_LOCALE } from "@/constants/admin";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: ADMIN_LOCALE, namespace: "admin.metadata" });
  return { title: t("pages") };
}

export default function AdminPagesPage() {
  return (
    <StaffOnly>
      <PagesView />
    </StaffOnly>
  );
}
