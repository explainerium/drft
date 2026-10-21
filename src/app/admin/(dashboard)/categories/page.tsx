import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CategoriesView } from "@/components/dashboard/catalog/CategoriesView";
import { StaffOnly } from "@/components/dashboard/StaffOnly";
import { ADMIN_LOCALE } from "@/constants/admin";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: ADMIN_LOCALE, namespace: "admin.metadata" });
  return { title: t("categories") };
}

export default function AdminCategoriesPage() {
  return (
    <StaffOnly>
      <CategoriesView />
    </StaffOnly>
  );
}
