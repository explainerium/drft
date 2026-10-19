"use client";

import { CircleCheckIcon, MessageCircleIcon, ShieldCheckIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { CatalogImageView } from "@/components/shared/CatalogImageView";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { CheckoutQuote } from "@/types/checkout";
import { formatPrice } from "@/utils/format";

/** The sticky right column: lines, cost tally and the DRFT commitment card. */
export function CheckoutSummary({ quote, updating }: { quote: CheckoutQuote; updating: boolean }) {
  const t = useTranslations("checkout.summary");
  const locale = useLocale();
  const money = (amount: string) => formatPrice(amount, locale, "EUR", { cents: true });
  const rate = quote.rates.find((r) => r.id === quote.shippingRateId);
  const { totals } = quote;

  return (
    <aside className="flex flex-col gap-6 lg:sticky lg:top-24">
      <section aria-labelledby="summary-title" className="flex flex-col gap-4 rounded-md bg-card p-5 shadow-xs sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 id="summary-title" className="font-heading text-xl leading-7 font-medium tracking-[-0.01em]">
            {t("title")}
          </h2>
          <p className="text-xs font-medium text-muted-foreground">{t("count", { count: quote.itemCount })}</p>
        </div>

        <ul className="flex flex-col gap-4">
          {quote.items.map((line) => (
            <li key={line.id} className="flex gap-4">
              <div className="relative h-24 w-20 shrink-0 rounded-sm bg-secondary">
                {line.image && (
                  <CatalogImageView
                    image={line.image}
                    alt=""
                    sizes="80px"
                    className="size-full rounded-sm object-cover"
                  />
                )}
                <span
                  className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground"
                  aria-label={t("quantity", { count: line.quantity })}
                >
                  {line.quantity}
                </span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                <div className="min-w-0">
                  {line.product.typeLabel && (
                    <p className="text-xs font-medium tracking-[0.05em] text-muted-foreground uppercase">
                      {line.product.typeLabel}
                    </p>
                  )}
                  <p className="text-sm font-semibold">{line.product.name}</p>
                  {line.options.length > 0 && (
                    <p className="text-sm text-muted-foreground">{line.options.map((o) => o.value).join(" · ")}</p>
                  )}
                </div>
                <div className="flex items-end justify-between gap-3">
                  <p className={cn("text-xs font-medium", line.isAvailable ? "text-brand" : "text-destructive")}>
                    {line.isAvailable ? t("inStock") : t("unavailable")}
                  </p>
                  <p className="text-sm font-semibold">{money(line.lineTotal)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <dl
          aria-live="polite"
          aria-busy={updating}
          className={cn(
            "flex flex-col gap-2 rounded-sm bg-secondary p-4 text-sm leading-[22px] transition-opacity",
            updating && "opacity-60",
          )}
        >
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t("subtotal")}</dt>
            <dd className="font-medium">{money(totals.subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{rate?.name ?? t("shipping")}</dt>
            <dd className={cn("font-medium", rate?.isFree && "text-brand uppercase")}>
              {totals.shipping === null ? (
                <span className="font-normal text-muted-foreground normal-case">{t("shippingPending")}</span>
              ) : rate?.isFree ? (
                t("free")
              ) : (
                money(totals.shipping)
              )}
            </dd>
          </div>
          <div className="flex justify-between gap-4 text-muted-foreground">
            <dt>{t("vat", { rate: totals.vat.rate })}</dt>
            <dd>{money(totals.vat.amount)}</dd>
          </div>
          <div className="mt-2 flex items-start justify-between gap-4 border-t border-input pt-3">
            <dt className="text-base font-medium">{t("total")}</dt>
            <dd className="text-right">
              <span className="block font-heading text-[22px] leading-7 font-semibold tracking-[-0.01em]">
                {money(totals.total)}
              </span>
              <span className="text-[11px] tracking-[0.05em] text-muted-foreground uppercase">{t("totalNote")}</span>
            </dd>
          </div>
        </dl>
      </section>

      <Commitment />
    </aside>
  );
}

function Commitment() {
  const t = useTranslations("checkout.commitment");
  const points = [
    { title: t("rigged"), body: t("riggedBody") },
    { title: t("exchange"), body: t("exchangeBody") },
  ];

  return (
    <section className="flex flex-col gap-4 rounded-md bg-card p-5 shadow-xs sm:p-6">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-xl bg-brand-soft text-brand" aria-hidden>
          <ShieldCheckIcon className="size-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">{t("title")}</h2>
          <p className="text-xs font-medium text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>
      <ul className="flex flex-col gap-2">
        {points.map((point) => (
          <li key={point.title} className="flex gap-2 text-sm leading-[22px] text-muted-foreground">
            <CircleCheckIcon className="mt-[3px] size-4 shrink-0 text-brand" aria-hidden />
            <p>
              <strong className="font-semibold text-foreground">{point.title}</strong> {point.body}
            </p>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between gap-3 rounded-sm bg-secondary p-2">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-input" aria-hidden>
            <MessageCircleIcon className="size-4 text-muted-foreground" />
          </span>
          <div>
            <p className="text-sm font-medium">{t("help")}</p>
            <p className="text-xs font-medium text-muted-foreground">{t("helpBody")}</p>
          </div>
        </div>
        <Link
          href="/contact"
          className="rounded-sm bg-card px-3 py-1.5 text-xs font-medium shadow-xs transition-colors hover:bg-accent"
        >
          {t("helpCta")}
        </Link>
      </div>
    </section>
  );
}
