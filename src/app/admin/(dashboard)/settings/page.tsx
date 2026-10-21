import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SettingsView } from "@/components/dashboard/setup/SettingsView";
import { AdminOnly, StaffOnly } from "@/components/dashboard/StaffOnly";
import { ADMIN_LOCALE } from "@/constants/admin";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: ADMIN_LOCALE, namespace: "admin.metadata" });
  return { title: t("settings") };
}

export default function AdminSettingsPage() {
  return (
    <StaffOnly>
      <AdminOnly>
        <SettingsView />
      </AdminOnly>
    </StaffOnly>
  );
}
