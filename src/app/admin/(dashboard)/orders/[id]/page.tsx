import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { OrderDetail } from "@/components/dashboard/orders/OrderDetail";
import { pageSkeleton, StaffOnly } from "@/components/dashboard/StaffOnly";
import { ADMIN_LOCALE } from "@/constants/admin";

type Props = PageProps<"/admin/orders/[id]">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: ADMIN_LOCALE, namespace: "admin.metadata" });
  return { title: t("order") };
}

async function OrderDetailFor({ params }: { params: Props["params"] }) {
  const { id } = await params;
  return (
    <StaffOnly>
      <OrderDetail id={id} />
    </StaffOnly>
  );
}

// The id is only known at request time.
export default function AdminOrderPage({ params }: Props) {
  return (
    <Suspense fallback={pageSkeleton}>
      <OrderDetailFor params={params} />
    </Suspense>
  );
}
