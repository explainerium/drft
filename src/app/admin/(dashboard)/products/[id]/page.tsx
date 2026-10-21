import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ProductEditor } from "@/components/dashboard/products/ProductEditor";
import { pageSkeleton, StaffOnly } from "@/components/dashboard/StaffOnly";
import { ADMIN_LOCALE } from "@/constants/admin";

type Props = PageProps<"/admin/products/[id]">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: ADMIN_LOCALE, namespace: "admin.metadata" });
  return { title: t("product") };
}

async function ProductEditorFor({ params }: { params: Props["params"] }) {
  const { id } = await params;
  return (
    <StaffOnly>
      <ProductEditor id={id} />
    </StaffOnly>
  );
}

// The id is only known at request time.
export default function AdminProductPage({ params }: Props) {
  return (
    <Suspense fallback={pageSkeleton}>
      <ProductEditorFor params={params} />
    </Suspense>
  );
}
