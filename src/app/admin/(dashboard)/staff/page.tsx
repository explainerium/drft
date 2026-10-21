import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { StaffView } from "@/components/dashboard/setup/StaffView";
import { AdminOnly, StaffOnly } from "@/components/dashboard/StaffOnly";
import { ADMIN_LOCALE } from "@/constants/admin";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: ADMIN_LOCALE, namespace: "admin.metadata" });
  return { title: t("staff") };
}

export default function AdminStaffPage() {
  return (
    <StaffOnly>
      <AdminOnly>
        <StaffView />
      </AdminOnly>
    </StaffOnly>
  );
}
