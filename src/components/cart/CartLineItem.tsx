"use client";

import { MinusIcon, PlusIcon, Trash2Icon, TriangleAlertIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { CatalogImageView } from "@/components/shared/CatalogImageView";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useRemoveCartItemMutation, useUpdateCartItemMutation } from "@/redux/api/cartApi";
import type { CartLine } from "@/types/cart";
import { apiErrorMessage } from "@/utils/apiError";
import { formatPrice } from "@/utils/format";

export function CartLineItem({ line, onNavigate }: { line: CartLine; onNavigate?: () => void }) {
  const t = useTranslations("cart");
  const locale = useLocale();
  const [updateItem, update] = useUpdateCartItemMutation();
  const [removeItem, remove] = useRemoveCartItemMutation();
  const busy = update.isLoading || remove.isLoading;
  const href = `/products/${line.product.slug}`;

  const run = async (action: Promise<unknown>) => {
    try {
      await action;
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? t("failed"));
    }
  };

  const setQuantity = (quantity: number) => run(updateItem({ itemId: line.id, quantity }).unwrap());

  return (
    <li className={cn("flex gap-4 rounded-sm bg-card p-4 shadow-xs sm:gap-5 sm:p-5", busy && "opacity-70")}>
      <Link
        href={href}
        onClick={onNavigate}
        tabIndex={-1}
        aria-hidden
        className="relative h-[120px] w-[92px] shrink-0 overflow-hidden rounded-sm bg-accent sm:h-36 sm:w-28"
      >
        {line.image && (
          <CatalogImageView image={line.image} alt="" sizes="112px" className="size-full object-cover" />
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {line.product.typeLabel && (
              <p className="text-xs font-medium tracking-[0.02em] text-muted-foreground">{line.product.typeLabel}</p>
            )}
            <h3 className="mt-1 font-heading text-lg leading-6 font-medium tracking-[-0.01em] sm:text-xl sm:leading-[25px]">
              <Link href={href} onClick={onNavigate} className="hover:underline">
                {line.product.name}
              </Link>
            </h3>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-heading text-lg leading-7 font-semibold tracking-[-0.01em] sm:text-xl">
              {formatPrice(line.lineTotal, locale)}
            </p>
            {line.quantity > 1 && (
              <p className="text-xs text-muted-foreground">
                {t("items.each", { price: formatPrice(line.unitPrice, locale) })}
              </p>
            )}
          </div>
        </div>
        {line.options.length > 0 && (
          <p className="mt-1.5 text-sm leading-[22px] text-muted-foreground">
            {line.options.map((o) => `${o.name}: ${o.value}`).join(" · ")}
          </p>
        )}

        {!line.isAvailable ? (
          <p className="mt-2 flex items-start gap-1.5 text-xs font-medium text-destructive">
            <TriangleAlertIcon className="mt-px size-3.5 shrink-0" aria-hidden />
            {t("items.unavailable")}
          </p>
        ) : (
          line.quantity > line.maxQuantity && (
            <p className="mt-2 flex items-start gap-1.5 text-xs font-medium text-warning">
              <TriangleAlertIcon className="mt-px size-3.5 shrink-0" aria-hidden />
              {t("items.limited", { count: line.maxQuantity })}
            </p>
          )
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          {line.isAvailable ? (
            <div
              role="group"
              aria-label={t("items.quantity", { name: line.product.name })}
              className="flex h-8 items-center gap-3 rounded-sm bg-secondary px-2"
            >
              <button
                type="button"
                onClick={() => setQuantity(line.quantity - 1)}
                disabled={busy || line.quantity <= 1}
                aria-label={t("items.decrease")}
                className="flex size-6 items-center justify-center text-muted-foreground disabled:opacity-40"
              >
                <MinusIcon className="size-3.5" />
              </button>
              <span className="min-w-3 text-center text-sm font-medium" aria-live="polite">
                {line.quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(line.quantity + 1)}
                disabled={busy || line.quantity >= line.maxQuantity}
                aria-label={t("items.increase")}
                className="flex size-6 items-center justify-center text-muted-foreground disabled:opacity-40"
              >
                <PlusIcon className="size-3.5" />
              </button>
            </div>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={() => run(removeItem({ itemId: line.id }).unwrap())}
            disabled={busy}
            aria-label={t("items.removeLabel", { name: line.product.name })}
            className="flex items-center gap-1 text-xs font-medium tracking-[0.02em] text-destructive hover:underline disabled:opacity-50"
          >
            <Trash2Icon className="size-3.5" aria-hidden />
            {t("items.remove")}
          </button>
        </div>
      </div>
    </li>
  );
}
