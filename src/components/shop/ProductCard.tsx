import { ArrowRightIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { CatalogImageView } from "@/components/shared/CatalogImageView";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { Link } from "@/i18n/navigation";
import type { ProductCard as ProductCardData } from "@/types/catalog";
import { formatPrice } from "@/utils/format";

/** Shop grid card. The product name link covers the whole card, so there is one link per product. */
export function ProductCard({ product, priority = false }: { product: ProductCardData; priority?: boolean }) {
  const t = useTranslations("shop.card");
  const locale = useLocale();
  const price = product.price.min;

  return (
    <article className="group relative flex w-full flex-col rounded-md bg-card p-2 transition-shadow hover:shadow-[0_8px_24px_rgb(0_0_0/0.06)]">
      <div className="relative aspect-[341/427] overflow-hidden rounded-md bg-accent">
        {product.featuredImage ? (
          <CatalogImageView
            image={product.featuredImage}
            alt={product.featuredImage.alt ?? product.name}
            sizes="(min-width: 1280px) 357px, (min-width: 768px) 33vw, 100vw"
            priority={priority}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            aria-hidden
            className="flex size-full items-center justify-center font-heading text-2xl text-subtle-foreground/40"
          >
            DRFT
          </div>
        )}
        {(product.badge || !product.inStock) && (
          <span className="absolute top-3 left-3 rounded-sm bg-background/90 px-2.5 py-1 text-xs font-medium tracking-[0.05em] uppercase">
            {product.inStock ? product.badge : t("soldOut")}
          </span>
        )}
        {/* Above the card-wide product link. */}
        <WishlistButton productId={product.id} productName={product.name} className="absolute top-3 right-3 z-10" />
      </div>

      <div className="flex flex-1 flex-col px-2 pt-4 pb-2">
        {product.typeLabel && (
          <p className="text-xs font-medium tracking-[0.05em] text-muted-foreground uppercase">{product.typeLabel}</p>
        )}
        <h3 className="mt-1 font-heading text-xl leading-7 font-medium tracking-[-0.01em]">
          <Link
            href={`/products/${product.slug}`}
            className="outline-none after:absolute after:inset-0 after:rounded-md focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
          >
            {product.name}
          </Link>
        </h3>
        {product.shortDescription && (
          <p className="mt-1 line-clamp-2 text-sm leading-[22px] text-muted-foreground">{product.shortDescription}</p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <p className="flex items-baseline gap-2">
            {price && <span className="font-heading text-[17px] font-semibold">{formatPrice(price, locale)}</span>}
            {product.compareAtPrice && (
              <s className="text-sm text-subtle-foreground">
                <span className="sr-only">{t("was")} </span>
                {formatPrice(product.compareAtPrice, locale)}
              </s>
            )}
          </p>
          <span
            aria-hidden
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-secondary px-4 text-sm font-medium transition-colors group-hover:bg-accent"
          >
            {t("view")}
            <ArrowRightIcon className="size-4" />
          </span>
        </div>
      </div>
    </article>
  );
}
