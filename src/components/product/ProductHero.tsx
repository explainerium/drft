"use client";

import { BadgeCheckIcon, MinusIcon, PlusIcon, ShoppingBagIcon, TruckIcon, WavesIcon, WindIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Container } from "@/components/shared/Container";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { cn } from "@/lib/utils";
import { useAddCartItemMutation } from "@/redux/api/cartApi";
import { useAppDispatch } from "@/redux/hooks";
import { setCartOpen } from "@/redux/slices/cartUiSlice";
import type { ProductDetail } from "@/types/catalog";
import { apiErrorMessage } from "@/utils/apiError";
import { formatPrice } from "@/utils/format";
import { defaultVariant, isAvailable, pickVariant, selectionOf } from "@/utils/variants";
import { ProductGallery } from "./ProductGallery";

// The backend allows 10 per line too, and less when stock is lower.
const MAX_QUANTITY = 10;

/**
 * Breadcrumb bar, gallery and purchase box. One client component because all
 * three follow the selected variant (SKU, stock, image, price).
 */
export function ProductHero({ product, breadcrumb }: { product: ProductDetail; breadcrumb: ReactNode }) {
  const t = useTranslations("product");
  const locale = useLocale();
  const [variant, setVariant] = useState(() => defaultVariant(product.variants));
  const [quantity, setQuantity] = useState(1);

  const selection = variant ? selectionOf(variant) : {};
  const purchasable = !!variant && (variant.inStock || variant.allowBackorder);
  const price = variant?.price ?? product.price.min;
  const compareAt = variant ? variant.compareAtPrice : product.compareAtPrice;

  // The selected variant's own picture leads; the React Compiler memoizes this.
  const gallery = product.images.length ? product.images : product.featuredImage ? [product.featuredImage] : [];
  const variantImage = variant?.image;
  const images = variantImage ? [variantImage, ...gallery.filter((i) => i.id !== variantImage.id)] : gallery;

  const eyebrow = [product.typeLabel, product.content.profile].filter(Boolean).join(" · ");

  const dispatch = useAppDispatch();
  const [addItem, { isLoading: adding }] = useAddCartItemMutation();

  const addToCart = async () => {
    if (!variant) return;
    try {
      await addItem({ variantId: variant.id, quantity }).unwrap();
      setQuantity(1);
      dispatch(setCartOpen(true));
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? t("purchase.failed"));
    }
  };

  return (
    <>
      <div className="bg-secondary">
        <Container className="flex min-h-10 flex-col justify-center gap-1 py-2 text-xs font-medium sm:flex-row sm:items-center sm:justify-between">
          {breadcrumb}
          {variant && (
            <p className="flex items-center gap-3 text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span
                  className={cn("size-1.5 rounded-full", purchasable ? "bg-success" : "bg-destructive")}
                  aria-hidden
                />
                {variant.inStock
                  ? t("stock.inStock")
                  : variant.allowBackorder
                    ? t("stock.backorder")
                    : t("stock.soldOut")}
              </span>
              {variant.sku && (
                <>
                  <span aria-hidden>·</span>
                  <span>{t("sku", { sku: variant.sku })}</span>
                </>
              )}
            </p>
          )}
        </Container>
      </div>

      <section className="bg-surface pt-8 pb-16 lg:pt-10 lg:pb-24">
        {/* Phone order: gallery, purchase box, highlight. Desktop: gallery + highlight left, box right. */}
        <Container className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_456px] lg:grid-rows-[auto_1fr] lg:gap-x-10">
          <div className="lg:col-start-1 lg:row-start-1">
            <ProductGallery
              images={images}
              name={product.name}
              badges={[
                ...(product.badge ? [{ label: product.badge }] : []),
                ...(variant?.inStock ? [{ label: t("gallery.readyToDispatch"), dot: true }] : []),
              ]}
            />
          </div>
          {product.content.highlight && (
            <div className="flex gap-3 rounded-lg bg-secondary p-4 lg:col-start-1 lg:row-start-2">
              <WindIcon className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
              <div>
                <p className="font-heading text-[15px] font-medium">{product.content.highlight.title}</p>
                <p className="mt-1 text-sm leading-[22px] text-muted-foreground">{product.content.highlight.body}</p>
              </div>
            </div>
          )}

          <div className="rounded-lg bg-card p-6 max-lg:row-start-2 lg:sticky lg:top-28 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:p-7">
            {eyebrow && (
              <p className="text-xs font-medium tracking-[0.05em] text-muted-foreground uppercase">{eyebrow}</p>
            )}
            <h1 className="mt-2 font-heading text-3xl leading-tight font-medium tracking-[-0.025em] md:text-4xl md:leading-[44px]">
              {product.name}
            </h1>

            <p className="mt-2 flex flex-wrap items-baseline gap-x-2">
              {price && <span className="font-heading text-[28px] font-semibold">{formatPrice(price, locale)}</span>}
              {compareAt && (
                <s className="text-base text-subtle-foreground">
                  <span className="sr-only">{t("purchase.was")} </span>
                  {formatPrice(compareAt, locale)}
                </s>
              )}
              <span className="text-sm text-muted-foreground">{t("purchase.vat")}</span>
            </p>

            {product.description && (
              <div
                className="rich-text mt-5 text-[15px] leading-6 text-muted-foreground"
                // Sanitized by the API (the editor's formatting only).
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            )}

            {product.options.map((option) => {
              const chosen = option.values.find((v) => v.id === selection[option.id]);
              const isColor = option.values.every((v) => v.hexColor);
              return (
                <fieldset key={option.id} className="mt-6">
                  <legend className="flex w-full items-center justify-between text-sm font-medium">
                    <span>{option.name}:</span>
                    {isColor && chosen && <span className="font-normal text-muted-foreground">{chosen.label}</span>}
                  </legend>
                  <div className={cn("mt-3 flex flex-wrap gap-2", !isColor && "grid grid-cols-5")}>
                    {option.values.map((value) => {
                      const selected = value.id === selection[option.id];
                      const available = isAvailable(product.variants, selection, option.id, value.id);
                      const onSelect = () => {
                        const next = pickVariant(product.variants, selection, option.id, value.id);
                        if (next) setVariant(next);
                      };
                      return isColor ? (
                        <button
                          key={value.id}
                          type="button"
                          onClick={onSelect}
                          aria-pressed={selected}
                          aria-label={available ? value.label : t("purchase.unavailable", { value: value.label })}
                          title={value.label}
                          className={cn(
                            "flex size-9 items-center justify-center rounded-xl bg-border outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                            selected && "ring-2 ring-foreground ring-offset-2 ring-offset-card",
                            !available && "opacity-40",
                          )}
                        >
                          <span
                            className="size-8 rounded-[10px]"
                            style={{ backgroundColor: value.hexColor ?? undefined }}
                          />
                        </button>
                      ) : (
                        <button
                          key={value.id}
                          type="button"
                          onClick={onSelect}
                          aria-pressed={selected}
                          className={cn(
                            "h-9 rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                            selected ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-accent",
                            !available && !selected && "text-subtle-foreground line-through",
                          )}
                        >
                          {value.label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              );
            })}

            <div className="mt-8 flex gap-3">
              <div
                className="flex h-12 items-center rounded-md bg-secondary"
                role="group"
                aria-label={t("purchase.quantity")}
              >
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label={t("purchase.decrease")}
                  className="flex h-full w-10 items-center justify-center disabled:opacity-40"
                >
                  <MinusIcon className="size-4" />
                </button>
                <span className="w-6 text-center text-sm font-medium" aria-live="polite">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
                  disabled={quantity >= MAX_QUANTITY}
                  aria-label={t("purchase.increase")}
                  className="flex h-full w-10 items-center justify-center disabled:opacity-40"
                >
                  <PlusIcon className="size-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={addToCart}
                disabled={!purchasable || adding}
                aria-busy={adding}
                className="flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium whitespace-nowrap text-primary-foreground transition-colors hover:bg-primary/85 disabled:cursor-not-allowed disabled:bg-subtle-foreground"
              >
                <ShoppingBagIcon className="hidden size-4 min-[400px]:block" />
                {purchasable ? (
                  <>
                    {/* The price is right above; narrow screens drop it from the label. */}
                    <span className="sm:hidden">{t("purchase.add")}</span>
                    <span className="hidden sm:inline">
                      {t("purchase.addToCart", { price: price ? formatPrice(price, locale) : "" })}
                    </span>
                  </>
                ) : (
                  t("stock.soldOut")
                )}
              </button>
              <WishlistButton
                productId={product.id}
                productName={product.name}
                variantId={variant?.id}
                className="size-12 shrink-0 rounded-md bg-secondary shadow-none hover:bg-accent"
              />
            </div>

            <ul className="mt-6 grid grid-cols-3 gap-2 text-center text-[11px] leading-[14px] text-muted-foreground">
              {[
                { key: "delivery" as const, Icon: TruckIcon },
                { key: "returns" as const, Icon: WavesIcon },
                { key: "warranty" as const, Icon: BadgeCheckIcon },
              ].map(({ key, Icon }) => (
                <li key={key} className="flex flex-col items-center gap-1.5 rounded-md bg-secondary px-2 py-3">
                  <Icon className="size-4 text-foreground" aria-hidden />
                  {t(`promises.${key}`)}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>
    </>
  );
}
