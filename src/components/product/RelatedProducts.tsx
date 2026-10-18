import { ArrowRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/shared/Container";
import { ProductCard } from "@/components/shop/ProductCard";
import { Link } from "@/i18n/navigation";
import type { ProductCard as ProductCardData } from "@/types/catalog";

/** "Complete your setup": the related products picked in the admin. */
export function RelatedProducts({ products, productName }: { products: ProductCardData[]; productName: string }) {
  const t = useTranslations("product.related");
  if (products.length === 0) return null;

  return (
    <section aria-labelledby="related-title" className="bg-surface py-16 lg:py-24">
      <Container>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-semibold tracking-[0.1em] text-brand uppercase">{t("eyebrow")}</p>
            <h2 id="related-title" className="mt-3 font-heading text-3xl font-medium tracking-[-0.025em] md:text-4xl">
              {t("title")}
            </h2>
            <p className="mt-2 text-[15px] leading-6 text-muted-foreground">{t("intro", { name: productName })}</p>
          </div>
          <Link href="/shop" className="inline-flex items-center gap-1 text-sm font-medium hover:underline">
            {t("viewAll")}
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>

        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
          {products.slice(0, 3).map((product) => (
            <li key={product.id} className="flex">
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
