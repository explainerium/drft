import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { CustomersView } from "@/components/dashboard/customers/CustomersView";
import { StaffOnly } from "@/components/dashboard/StaffOnly";
import { ADMIN_LOCALE } from "@/constants/admin";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: ADMIN_LOCALE, namespace: "admin.metadata" });
  return { title: t("customers") };
}

// Filters are read from the URL in the browser, which a prerender cannot know.
export default function AdminCustomersPage() {
  return (
    <StaffOnly>
      <Suspense>
        <CustomersView />
      </Suspense>
    </StaffOnly>
  );
}
