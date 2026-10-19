import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { OrderComplete } from "@/components/checkout/OrderComplete";
import { SignedIn } from "@/components/account/AccountShell";

type Props = PageProps<"/[locale]/account/orders/[id]">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account.orders");
  return { title: t("title") };
}

async function OrderFor({ params }: { params: Props["params"] }) {
  const { id } = await params;
  return (
    <SignedIn>
      <OrderComplete orderId={id} mode="account" />
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
