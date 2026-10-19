import { ArrowRightIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { CatalogImageView } from "@/components/shared/CatalogImageView";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { Link } from "@/i18n/navigation";
import type { ProductCard } from "@/types/catalog";
import { formatPrice } from "@/utils/format";

/** Product card of the home "Fleet" row: like the shop card, with colour dots and a text link. */
export function FleetCard({ product, priority = false }: { product: ProductCard; priority?: boolean }) {
  const t = useTranslations("home.fleet");
  const locale = useLocale();
  const { min, max } = product.price;

  return (
    <article className="group relative flex w-full flex-col overflow-hidden rounded-lg bg-card shadow-xs transition-shadow hover:shadow-[0_8px_24px_rgb(0_0_0/0.06)]">
      <div className="relative aspect-[357/447] overflow-hidden bg-secondary">
        {product.featuredImage && (
          <CatalogImageView
            image={product.featuredImage}
            alt={product.featuredImage.alt ?? product.name}
            sizes="(min-width: 1280px) 357px, (min-width: 640px) 50vw, 100vw"
            priority={priority}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
        {(product.badge || !product.inStock) && (
          <span className="absolute top-4 left-4 rounded-sm bg-white/90 px-2.5 py-1 text-xs font-medium tracking-[0.02em] backdrop-blur-xs">
            {product.inStock ? product.badge : t("soldOut")}
          </span>
        )}
        {/* Above the card-wide product link. */}
        <WishlistButton productId={product.id} productName={product.name} className="absolute top-4 right-4 z-10" />
      </div>

      <div className="flex flex-1 flex-col p-6">
        {product.typeLabel && (
          <p className="text-xs font-medium tracking-[0.05em] text-muted-foreground uppercase">{product.typeLabel}</p>
        )}
        <h3 className="mt-1 font-heading text-xl leading-7 font-medium tracking-[-0.01em]">
          <Link
            href={`/products/${product.slug}`}
            className="outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
          >
            {product.name}
          </Link>
        </h3>
        {product.shortDescription && (
          <p className="mt-2 line-clamp-2 text-sm leading-[22px] text-muted-foreground">{product.shortDescription}</p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-7">
          <p className="flex items-baseline gap-2">
            {min && (
              <span className="font-heading text-xl leading-7 font-semibold tracking-[-0.01em]">
                {min !== max ? t("from", { price: formatPrice(min, locale) }) : formatPrice(min, locale)}
              </span>
            )}
            {product.compareAtPrice && (
              <s className="text-sm text-subtle-foreground">
                <span className="sr-only">{t("was")} </span>
                {formatPrice(product.compareAtPrice, locale)}
              </s>
            )}
          </p>
          {product.swatches.length > 1 && (
            <ul className="flex gap-1.5" aria-label={t("colours")}>
              {product.swatches.map((s) => (
                <li
                  key={s.hexColor}
                  title={s.label}
                  className="size-3.5 rounded-full ring-1 ring-black/10 ring-inset"
                  style={{ backgroundColor: s.hexColor }}
                >
                  <span className="sr-only">{s.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <span aria-hidden className="mt-4 inline-flex items-center gap-1 text-sm font-medium group-hover:underline">
          {t("view")}
          <ArrowRightIcon className="size-4" />
        </span>
      </div>
    </article>
  );
}
