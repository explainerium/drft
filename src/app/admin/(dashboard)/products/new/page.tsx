import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ProductEditor } from "@/components/dashboard/products/ProductEditor";
import { StaffOnly } from "@/components/dashboard/StaffOnly";
import { ADMIN_LOCALE } from "@/constants/admin";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: ADMIN_LOCALE, namespace: "admin.metadata" });
  return { title: t("newProduct") };
}

export default function AdminNewProductPage() {
  return (
    <StaffOnly>
      <ProductEditor />
    </StaffOnly>
  );
}
