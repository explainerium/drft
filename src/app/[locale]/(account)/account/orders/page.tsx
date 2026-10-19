import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { OrderHistory } from "@/components/account/OrderHistory";
import { SignedIn } from "@/components/account/AccountShell";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account.orders");
  return { title: t("title") };
}

export default function OrdersPage() {
  return (
    // The page number comes from the query string.
    <Suspense>
      <SignedIn>
        <OrderHistory />
      </SignedIn>
    </Suspense>
  );
}
