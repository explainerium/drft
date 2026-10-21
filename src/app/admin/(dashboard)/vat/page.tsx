import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { VatView } from "@/components/dashboard/setup/VatView";
import { AdminOnly, StaffOnly } from "@/components/dashboard/StaffOnly";
import { ADMIN_LOCALE } from "@/constants/admin";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: ADMIN_LOCALE, namespace: "admin.metadata" });
  return { title: t("vat") };
}

export default function AdminVatPage() {
  return (
    <StaffOnly>
      <AdminOnly>
        <VatView />
      </AdminOnly>
    </StaffOnly>
  );
}
