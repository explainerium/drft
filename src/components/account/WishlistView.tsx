"use client";

import { ArrowRightIcon, HeartIcon, ShoppingBagIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { CatalogImageView } from "@/components/shared/CatalogImageView";
import { Link } from "@/i18n/navigation";
import { useAddCartItemMutation } from "@/redux/api/cartApi";
import { useAppDispatch } from "@/redux/hooks";
import { setCartOpen } from "@/redux/slices/cartUiSlice";
import { useRemoveFromWishlistMutation, useWishlist } from "@/redux/api/wishlistApi";
import type { WishlistItem } from "@/types/wishlist";
import { apiErrorMessage } from "@/utils/apiError";
import { formatPrice } from "@/utils/format";

/** /account/wishlist: saved products, newest first, with add to cart where the version is known. */
export function WishlistView() {
  const t = useTranslations("account.wishlist");
  const { items, isLoading, isError, refetch } = useWishlist();

  return (
    <>
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-heading text-3xl font-medium tracking-[-0.025em] sm:text-4xl">{t("title")}</h1>
        {items.length > 0 && <p className="text-sm text-muted-foreground">{t("count", { count: items.length })}</p>}
      </header>
      {isLoading ? (
        <div aria-hidden className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-96 animate-pulse rounded-md bg-card" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-start gap-3 rounded-md bg-card p-6 shadow-xs">
          <p className="text-sm text-muted-foreground">{t("error")}</p>
          <button type="button" onClick={() => refetch()} className="text-sm font-medium underline">
            {t("retry")}
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-md bg-card px-5 py-14 text-center shadow-xs">
          <HeartIcon className="size-8 text-muted-foreground" aria-hidden />
          <p className="max-w-sm text-sm text-muted-foreground">{t("empty")}</p>
          <Link
            href="/shop"
            className="inline-flex h-12 items-center gap-2 rounded-sm bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/85"
          >
            {t("emptyCta")}
            <ArrowRightIcon className="size-4" aria-hidden />
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <SavedProduct key={item.id} item={item} />
          ))}
        </ul>
      )}
    </>
  );
}

function SavedProduct({ item }: { item: WishlistItem }) {
  const t = useTranslations("account.wishlist");
  const locale = useLocale();
  const dispatch = useAppDispatch();
  const [addToCart, adding] = useAddCartItemMutation();
  const [remove, removing] = useRemoveFromWishlistMutation();
  const { product, variant } = item;
  const href = `/products/${product.slug}`;
  const price = variant?.price ?? product.price.min;

  const add = async () => {
    if (!variant) return;
    try {
      await addToCart({ variantId: variant.id, quantity: 1 }).unwrap();
      dispatch(setCartOpen(true));
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? t("error"));
    }
  };

  const action = !variant ? (
    <Link
      href={href}
      className="flex h-10 flex-1 items-center justify-center gap-2 rounded-sm bg-secondary px-4 text-sm font-medium hover:bg-accent"
    >
      {t("chooseOptions")}
    </Link>
  ) : (
    <button
      type="button"
      onClick={add}
      disabled={!variant.available || adding.isLoading}
      className="flex h-10 flex-1 items-center justify-center gap-2 rounded-sm bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/85 disabled:cursor-not-allowed disabled:bg-subtle-foreground"
    >
      <ShoppingBagIcon className="size-4" aria-hidden />
      {variant.available ? t("addToCart") : t("soldOut")}
    </button>
  );

  return (
    <li className="flex flex-col overflow-hidden rounded-md bg-card shadow-xs">
      <Link href={href} tabIndex={-1} aria-hidden className="block aspect-[4/5] overflow-hidden bg-secondary">
        {product.featuredImage && (
          <CatalogImageView
            image={product.featuredImage}
            alt=""
            sizes="(min-width: 1280px) 300px, (min-width: 640px) 45vw, 100vw"
            className="size-full object-cover"
          />
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-4">
        {product.typeLabel && (
          <p className="text-xs font-medium tracking-[0.05em] text-muted-foreground uppercase">{product.typeLabel}</p>
        )}
        <h2 className="font-heading text-lg leading-6 font-medium tracking-[-0.01em]">
          <Link href={href} className="hover:underline">
            {product.name}
          </Link>
        </h2>
        {variant && variant.options.length > 0 && (
          <p className="text-sm text-muted-foreground">{variant.options.map((o) => o.value).join(" · ")}</p>
        )}
        {price && <p className="mt-1 font-semibold">{formatPrice(price, locale)}</p>}
        <div className="mt-auto flex items-center gap-2 pt-4">
          {action}
          <button
            type="button"
            onClick={() =>
              remove(product.id)
                .unwrap()
                .catch((error: unknown) => toast.error(apiErrorMessage(error) ?? t("error")))
            }
            disabled={removing.isLoading}
            aria-label={t("removeLabel", { name: product.name })}
            className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-secondary text-destructive hover:bg-accent disabled:opacity-60"
          >
            <HeartIcon className="size-4 fill-current" />
          </button>
        </div>
      </div>
    </li>
  );
}
