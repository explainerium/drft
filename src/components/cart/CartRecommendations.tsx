"use client";

import { ArrowRightIcon, PlusIcon, SparklesIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { CatalogImageView } from "@/components/shared/CatalogImageView";
import { Link } from "@/i18n/navigation";
import { useAddCartItemMutation } from "@/redux/api/cartApi";
import type { CartRecommendation } from "@/types/cart";
import { apiErrorMessage } from "@/utils/apiError";
import { formatPrice } from "@/utils/format";

const actionClass =
  "flex h-8 w-full items-center justify-center gap-1.5 rounded-sm bg-secondary text-xs font-medium tracking-[0.02em] transition-colors hover:bg-accent disabled:opacity-50";

/** "Curated for your setup": related products, added in one click when they have no options. */
export function CartRecommendations({
  items,
  onNavigate,
}: {
  items: CartRecommendation[];
  onNavigate?: () => void;
}) {
  const t = useTranslations("cart");
  const locale = useLocale();
  const [addItem, { isLoading, originalArgs }] = useAddCartItemMutation();
  if (items.length === 0) return null;

  const add = async (variantId: string) => {
    try {
      await addItem({ variantId, quantity: 1 }).unwrap();
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? t("failed"));
    }
  };

  return (
    <section aria-labelledby="cart-recommendations" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3
          id="cart-recommendations"
          className="text-xs font-medium tracking-[0.1em] text-muted-foreground uppercase"
        >
          {t("recommendations.title")}
        </h3>
        <span className="flex items-center gap-1 text-xs font-medium tracking-[0.02em] text-brand">
          <SparklesIcon className="size-3" aria-hidden />
          {t("recommendations.badge")}
        </span>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => {
          const price =
            item.price.min === item.price.max
              ? formatPrice(item.price.min, locale)
              : t("recommendations.from", { price: formatPrice(item.price.min, locale) });
          return (
            <li key={item.id} className="flex flex-col gap-3 rounded-sm bg-card p-4 shadow-xs">
              <div className="flex gap-3">
                <div className="size-14 shrink-0 overflow-hidden rounded-sm bg-accent">
                  {item.image && (
                    <CatalogImageView image={item.image} alt="" sizes="56px" className="size-full object-cover" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm leading-[19px] font-medium tracking-[-0.005em]">
                    <Link href={`/products/${item.slug}`} onClick={onNavigate} className="hover:underline">
                      {item.name}
                    </Link>
                  </p>
                  {item.typeLabel && (
                    <p className="text-xs font-medium tracking-[0.02em] text-muted-foreground">{item.typeLabel}</p>
                  )}
                  <p className="mt-0.5 text-sm font-semibold">{price}</p>
                </div>
              </div>
              {item.variantId ? (
                <button
                  type="button"
                  onClick={() => add(item.variantId!)}
                  disabled={isLoading && originalArgs?.variantId === item.variantId}
                  className={actionClass}
                >
                  <PlusIcon className="size-3" aria-hidden />
                  {t("recommendations.add")}
                </button>
              ) : (
                <Link href={`/products/${item.slug}`} onClick={onNavigate} className={actionClass}>
                  {t("recommendations.view")}
                  <ArrowRightIcon className="size-3" aria-hidden />
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
