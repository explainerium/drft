import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { CustomerDetail } from "@/components/dashboard/customers/CustomerDetail";
import { pageSkeleton, StaffOnly } from "@/components/dashboard/StaffOnly";
import { ADMIN_LOCALE } from "@/constants/admin";

type Props = PageProps<"/admin/customers/[id]">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: ADMIN_LOCALE, namespace: "admin.metadata" });
  return { title: t("customer") };
}

async function CustomerDetailFor({ params }: { params: Props["params"] }) {
  const { id } = await params;
  return (
    <StaffOnly>
      <CustomerDetail id={id} />
    </StaffOnly>
  );
}

// The id is only known at request time.
export default function AdminCustomerPage({ params }: Props) {
  return (
    <Suspense fallback={pageSkeleton}>
      <CustomerDetailFor params={params} />
    </Suspense>
  );
}
