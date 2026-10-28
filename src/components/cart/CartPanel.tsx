"use client";

import { ArrowRightIcon, LockIcon, RefreshCwIcon, ShieldCheckIcon, ShoppingBagIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useCart } from "@/redux/api/cartApi";
import type { Cart } from "@/types/cart";
import { formatPrice } from "@/utils/format";
import { CartLineItem } from "./CartLineItem";
import { CartRecommendations } from "./CartRecommendations";
import { FreeShippingProgress } from "./FreeShippingProgress";

const TRUST = [
  { key: "trial", Icon: RefreshCwIcon },
  { key: "warranty", Icon: ShieldCheckIcon },
  { key: "secure", Icon: LockIcon },
] as const;

const gutter = "px-5 sm:px-10";

/**
 * The cart as in the design's slide-over: header with the shipping progress,
 * a scrolling list, and the summary pinned at the bottom. Used by the drawer
 * and the /cart page; `heading` and `closeButton` come from the host.
 */
export function CartPanel({
  heading,
  closeButton,
  onNavigate,
  className,
}: {
  heading: (title: string) => ReactNode;
  closeButton?: ReactNode;
  /** Called when a link inside leaves the panel (the drawer closes). */
  onNavigate?: () => void;
  className?: string;
}) {
  const t = useTranslations("cart");
  const { data: cart, isLoading, isUninitialized, isError, refetch } = useCart();
  const empty = !!cart && cart.items.length === 0;

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col bg-surface", className)}>
      <header className={cn("flex flex-col gap-5 bg-card pt-6 pb-6 shadow-xs sm:pt-8", gutter)}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {heading(t("title"))}
            {cart && cart.summary.itemCount > 0 && (
              <span className="rounded-sm bg-accent px-2.5 py-1 text-xs font-medium tracking-[0.05em] text-muted-foreground uppercase">
                {t("count", { count: cart.summary.itemCount })}
              </span>
            )}
          </div>
          {closeButton}
        </div>
        {cart && !empty && <FreeShippingProgress summary={cart.summary} />}
      </header>

      {isLoading || isUninitialized ? (
        <div aria-busy className={cn("flex flex-1 flex-col gap-6 py-8", gutter)}>
          <span className="sr-only">{t("loading")}</span>
          {[0, 1].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-sm bg-card" />
          ))}
        </div>
      ) : isError || !cart ? (
        <div className={cn("flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center", gutter)}>
          <p className="text-sm text-muted-foreground">{t("error")}</p>
          <button type="button" onClick={() => refetch()} className="text-sm font-medium underline">
            {t("retry")}
          </button>
        </div>
      ) : empty ? (
        <EmptyCart onNavigate={onNavigate} />
      ) : (
        <>
          <div className={cn("flex min-h-0 flex-1 flex-col gap-10 overflow-y-auto py-8", gutter)}>
            <section aria-labelledby="cart-items" className="flex flex-col gap-6">
              <h3 id="cart-items" className="text-xs font-medium tracking-[0.1em] text-muted-foreground uppercase">
                {t("items.title")}
              </h3>
              <ul className="flex flex-col gap-6">
                {cart.items.map((line) => (
                  <CartLineItem key={line.id} line={line} onNavigate={onNavigate} />
                ))}
              </ul>
            </section>
            <CartRecommendations items={cart.recommendations} onNavigate={onNavigate} />
            <ul className="grid grid-cols-3 gap-3 rounded-sm bg-accent p-4 text-center">
              {TRUST.map(({ key, Icon }) => (
                <li key={key} className="flex flex-col items-center gap-1.5">
                  <Icon className="size-4 text-muted-foreground" aria-hidden />
                  <span className="text-xs font-medium tracking-[0.02em]">{t(`trust.${key}.title`)}</span>
                  <span className="text-[11px] leading-[14px] font-medium tracking-[0.02em] text-muted-foreground">
                    {t(`trust.${key}.body`)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <CartTotals cart={cart} onNavigate={onNavigate} />
        </>
      )}
    </div>
  );
}

function CartTotals({ cart, onNavigate }: { cart: Cart; onNavigate?: () => void }) {
  const t = useTranslations("cart.summary");
  const locale = useLocale();
  const { summary } = cart;
  const qualified = summary.freeShipping.qualified;
  const blocked = cart.items.some((line) => !line.isAvailable);
  const money = (amount: string) => formatPrice(amount, locale, "EUR", { cents: true });

  return (
    <footer className={cn("flex flex-col gap-5 bg-card py-6 shadow-[0_-8px_24px_rgb(0_0_0/0.05)]", gutter)}>
      <dl className="flex flex-col gap-2 text-sm leading-[22px]">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{t("subtotal")}</dt>
          <dd className="font-medium">{money(summary.subtotal)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="flex items-center gap-1.5 text-muted-foreground">
            {qualified ? t("delivery") : t("shipping")}
            {qualified && (
              <span className="rounded-sm bg-brand/10 px-1.5 text-[11px] font-medium text-brand uppercase">
                {t("free")}
              </span>
            )}
          </dt>
          <dd className={qualified ? "font-medium text-brand" : "text-muted-foreground"}>
            {qualified ? money("0.00") : t("atCheckout")}
          </dd>
        </div>
        <div className="flex justify-between gap-4 text-muted-foreground">
          <dt>{t("vat", { rate: summary.vat.rate })}</dt>
          <dd>{money(summary.vat.amount)}</dd>
        </div>
      </dl>

      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-heading text-xl leading-7 font-semibold tracking-[-0.01em]">{t("total")}</p>
          <p className="text-xs font-medium tracking-[0.02em] text-muted-foreground">
            {qualified ? t("totalNoteFree") : t("totalNote")}
          </p>
        </div>
        <p className="font-heading text-3xl font-semibold tracking-[-0.025em] sm:text-4xl sm:leading-[44px]">
          {money(summary.subtotal)}
        </p>
      </div>

      <Link
        href="/checkout"
        onClick={onNavigate}
        aria-disabled={blocked}
        className={cn(
          "flex h-14 items-center justify-between gap-4 rounded-sm bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85",
          blocked && "pointer-events-none bg-subtle-foreground",
        )}
      >
        {t("checkout")}
        <span className="flex items-center gap-2">
          {money(summary.subtotal)}
          <ArrowRightIcon className="size-4" aria-hidden />
        </span>
      </Link>
    </footer>
  );
}

function EmptyCart({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations("cart.empty");

  return (
    <div className={cn("flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center", gutter)}>
      <span className="flex size-14 items-center justify-center rounded-full bg-secondary" aria-hidden>
        <ShoppingBagIcon className="size-6 text-muted-foreground" />
      </span>
      <h3 className="font-heading text-2xl font-medium tracking-[-0.02em]">{t("title")}</h3>
      <p className="max-w-xs text-sm leading-[22px] text-muted-foreground">{t("body")}</p>
      <Link
        href="/shop"
        onClick={onNavigate}
        className="mt-2 inline-flex h-12 items-center gap-2 rounded-sm bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85"
      >
        {t("cta")}
        <ArrowRightIcon className="size-4" aria-hidden />
      </Link>
    </div>
  );
}
