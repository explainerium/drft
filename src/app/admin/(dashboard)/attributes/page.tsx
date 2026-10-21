import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AttributesView } from "@/components/dashboard/catalog/AttributesView";
import { StaffOnly } from "@/components/dashboard/StaffOnly";
import { ADMIN_LOCALE } from "@/constants/admin";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: ADMIN_LOCALE, namespace: "admin.metadata" });
  return { title: t("attributes") };
}

export default function AdminAttributesPage() {
  return (
    <StaffOnly>
      <AttributesView />
    </StaffOnly>
  );
}
