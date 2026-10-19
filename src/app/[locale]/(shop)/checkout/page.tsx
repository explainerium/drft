import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CheckoutProgress, CheckoutView } from "@/components/checkout/CheckoutView";
import { Container } from "@/components/shared/Container";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("checkout");
  return { title: t("title"), description: t("description"), robots: { index: false } };
}

export default async function CheckoutPage() {
  const t = await getTranslations("checkout");

  return (
    <main className="flex-1 bg-surface pt-8 pb-16 lg:pt-12 lg:pb-24">
      <Container className="flex flex-col gap-6">
        <h1 className="sr-only">{t("title")}</h1>
        <CheckoutProgress />
        <CheckoutView />
      </Container>
    </main>
  );
}
