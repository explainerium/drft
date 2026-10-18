import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CartPageView } from "@/components/cart/CartPageView";
import { Container } from "@/components/shared/Container";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cart");
  return { title: t("title"), robots: { index: false } };
}

/** The drawer's content as a page, for direct links to /cart. */
export default function CartPage() {
  return (
    <main className="flex-1 bg-secondary py-10 lg:py-16">
      <Container className="max-w-[752px]">
        <CartPageView />
      </Container>
    </main>
  );
}
