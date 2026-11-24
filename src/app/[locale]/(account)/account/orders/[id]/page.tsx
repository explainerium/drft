import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { OrderComplete } from "@/components/checkout/OrderComplete";
import { SignedIn } from "@/components/account/AccountShell";
import { getPublicSettings } from "@/lib/content";

type Props = PageProps<"/[locale]/account/orders/[id]">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account.orders");
  return { title: t("title") };
}

async function OrderFor({ params }: { params: Props["params"] }) {
  const [{ id }, settings] = await Promise.all([params, getPublicSettings().catch(() => null)]);
  return (
    <SignedIn>
      {/* Returns go to the store address from the settings. */}
      <OrderComplete orderId={id} mode="account" storeAddress={settings?.store.address ?? ""} />
    </SignedIn>
  );
}

export default function AccountOrderPage({ params }: Props) {
  return (
    <Suspense>
      <OrderFor params={params} />
    </Suspense>
  );
}
