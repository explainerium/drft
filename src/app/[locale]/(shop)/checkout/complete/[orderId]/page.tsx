import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { OrderComplete } from "@/components/checkout/OrderComplete";
import { Container } from "@/components/shared/Container";

type Props = PageProps<"/[locale]/checkout/complete/[orderId]">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("checkout");
  return { title: t("title"), robots: { index: false } };
}

async function OrderCompleteFor({ params }: { params: Props["params"] }) {
  const { orderId } = await params;
  return <OrderComplete orderId={orderId} />;
}

/** After placing an order. The order is read in the browser with the buyer's order cookie. */
export default function OrderCompletePage({ params }: Props) {
  return (
    <main className="flex-1 bg-surface py-10 lg:py-16">
      <Container className="max-w-[880px]">
        <Suspense fallback={<div aria-hidden className="h-[480px] animate-pulse rounded-md bg-card" />}>
          <OrderCompleteFor params={params} />
        </Suspense>
      </Container>
    </main>
  );
}
