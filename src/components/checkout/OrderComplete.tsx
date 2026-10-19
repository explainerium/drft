"use client";

import { ArrowLeftIcon, ArrowRightIcon, PackageXIcon } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useIsClient } from "@/hooks/useIsClient";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { ACCOUNT_LINKS } from "@/constants/navigation";
import { useGetOrderQuery } from "@/redux/api/checkoutApi";
import type { Order, PostalAddress } from "@/types/checkout";
import { formatPrice } from "@/utils/format";
import { OrderStatusBadge } from "./OrderStatusBadge";

const skeleton = <div aria-hidden className="h-[480px] animate-pulse rounded-md bg-card" />;

/** How the order is introduced: right after checkout, or from the order history. */
type Mode = "confirmation" | "account";

/**
 * One order: the checkout confirmation page and the account order page. Only
 * the buyer can read it (their account, or the order cookie from checkout).
 */
export function OrderComplete({ orderId, mode = "confirmation" }: { orderId: string; mode?: Mode }) {
  if (!useIsClient()) return skeleton;
  return <LiveOrder orderId={orderId} mode={mode} />;
}

function LiveOrder({ orderId, mode }: { orderId: string; mode: Mode }) {
  const { data: order, isLoading, error, refetch } = useGetOrderQuery(orderId);
  if (isLoading) return skeleton;
  if (order) return <OrderDetails order={order} mode={mode} />;
  // 400 (not an order id) and 404 (no such order, or not this buyer's) read the same.
  const missing = !!error && "status" in error && (error.status === 404 || error.status === 400);
  return <OrderProblem missing={missing} onRetry={refetch} />;
}

function OrderProblem({ missing, onRetry }: { missing: boolean; onRetry: () => void }) {
  const t = useTranslations("order");
  return (
    <div className="flex flex-col items-center gap-4 rounded-md bg-card px-5 py-16 text-center shadow-xs">
      <PackageXIcon className="size-8 text-muted-foreground" aria-hidden />
      {missing ? (
        <>
          <h1 className="font-heading text-2xl font-medium tracking-[-0.02em]">{t("notFound.title")}</h1>
          <p className="max-w-sm text-sm leading-[22px] text-muted-foreground">{t("notFound.body")}</p>
          <ShopLink>{t("notFound.cta")}</ShopLink>
        </>
      ) : (
        <>
          <h1 className="font-heading text-2xl font-medium tracking-[-0.02em]">{t("error")}</h1>
          <button type="button" onClick={onRetry} className="text-sm font-medium underline">
            {t("retry")}
          </button>
        </>
      )}
    </div>
  );
}

function OrderDetails({ order, mode }: { order: Order; mode: Mode }) {
  const t = useTranslations("order");
  const locale = useLocale();
  const format = useFormatter();
  const money = (amount: string) => formatPrice(amount, locale, order.currency, { cents: true });
  const pending = order.status === "PENDING_PAYMENT";
  const cancelled = order.status === "CANCELLED";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col items-start gap-3 rounded-md bg-card p-6 shadow-xs sm:p-8">
        {mode === "account" && (
          <Link
            href={ACCOUNT_LINKS.orders}
            className="mb-1 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" aria-hidden />
            {t("backToOrders")}
          </Link>
        )}
        <OrderStatusBadge status={order.status} />
        <h1 className="font-heading text-3xl font-medium tracking-[-0.025em] sm:text-4xl">
          {mode === "account"
            ? t("heading", { number: order.number })
            : t("thanks", { name: order.shippingAddress.firstName })}
        </h1>
        <p className="text-sm leading-[22px] text-muted-foreground">
          {mode === "account"
            ? t("placedOn", { date: format.dateTime(new Date(order.createdAt), { dateStyle: "long" }) })
            : t("placed", { number: order.number, email: order.email })}
        </p>
        {pending && order.reservedUntil && (
          <p className="rounded-sm bg-secondary p-4 text-sm leading-[22px] text-muted-foreground">
            {t("pending", { time: format.dateTime(new Date(order.reservedUntil), { timeStyle: "short" }) })}
          </p>
        )}
        {cancelled && <p className="rounded-sm bg-secondary p-4 text-sm text-muted-foreground">{t("cancelled")}</p>}
      </header>

      <div className="grid items-start gap-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section aria-labelledby="order-items" className="flex flex-col gap-4 rounded-md bg-card p-6 shadow-xs">
          <h2 id="order-items" className="font-heading text-xl font-medium tracking-[-0.01em]">
            {t("items")}
          </h2>
          <ul className="flex flex-col gap-4">
            {order.items.map((item) => (
              <li key={item.id} className="flex gap-4">
                <div className="h-24 w-20 shrink-0 overflow-hidden rounded-sm bg-secondary">
                  {item.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt="" loading="lazy" className="size-full object-cover" />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                  <div>
                    {item.typeLabel && (
                      <p className="text-xs font-medium tracking-[0.05em] text-muted-foreground uppercase">
                        {item.typeLabel}
                      </p>
                    )}
                    <Link href={`/products/${item.productSlug}`} className="text-sm font-semibold hover:underline">
                      {item.productName}
                    </Link>
                    {item.options.length > 0 && (
                      <p className="text-sm text-muted-foreground">{item.options.map((o) => o.value).join(" · ")}</p>
                    )}
                  </div>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">{t("quantity", { count: item.quantity })}</span>
                    <span className="font-semibold">{money(item.lineTotal)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <dl className="flex flex-col gap-2 rounded-sm bg-secondary p-4 text-sm leading-[22px]">
            <Row label={t("summary.subtotal")} value={money(order.totals.subtotal)} />
            <Row
              label={order.shippingMethod}
              value={order.totals.shipping === "0.00" ? t("summary.free") : money(order.totals.shipping)}
            />
            <Row
              label={t("summary.vat", { rate: order.totals.vat.rate })}
              value={money(order.totals.vat.amount)}
              muted
            />
            <div className="mt-2 flex justify-between gap-4 border-t border-input pt-3">
              <dt className="text-base font-medium">{t("summary.total")}</dt>
              <dd className="font-heading text-[22px] leading-7 font-semibold tracking-[-0.01em]">
                {money(order.totals.total)}
              </dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="order-delivery" className="flex flex-col gap-5 rounded-md bg-card p-6 shadow-xs">
          <h2 id="order-delivery" className="font-heading text-xl font-medium tracking-[-0.01em]">
            {t("delivery")}
          </h2>
          <Detail title={t("shippingTo")}>
            <AddressLines address={order.shippingAddress} />
          </Detail>
          <Detail title={t("billingTo")}>
            <AddressLines address={order.billingAddress} />
          </Detail>
          <Detail title={t("method")}>{order.shippingMethod}</Detail>
          <Detail title={t("contact")}>
            {order.email}
            {order.phone && <br />}
            {order.phone}
          </Detail>
        </section>
      </div>

      <div>
        <ShopLink>{t("continue")}</ShopLink>
      </div>
    </div>
  );
}

function Row({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={cn("flex justify-between gap-4", muted && "text-muted-foreground")}>
      <dt className={cn(!muted && "text-muted-foreground")}>{label}</dt>
      <dd className={cn(!muted && "font-medium")}>{value}</dd>
    </div>
  );
}

function Detail({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-xs font-medium tracking-[0.05em] text-muted-foreground uppercase">{title}</h3>
      <div className="text-sm leading-[22px]">{children}</div>
    </div>
  );
}

function AddressLines({ address }: { address: PostalAddress }) {
  const locale = useLocale();
  const country = new Intl.DisplayNames([locale], { type: "region" }).of(address.countryCode) ?? address.countryCode;
  const lines = [
    `${address.firstName} ${address.lastName}`,
    address.company,
    address.street1,
    address.street2,
    `${address.postcode} ${address.city}`,
    country,
  ].filter(Boolean);

  return (
    <address className="not-italic">
      {lines.map((line) => (
        <span key={line} className="block">
          {line}
        </span>
      ))}
    </address>
  );
}

function ShopLink({ children }: { children: ReactNode }) {
  return (
    <Link
      href="/shop"
      className="inline-flex h-12 items-center gap-2 rounded-sm bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85"
    >
      {children}
      <ArrowRightIcon className="size-4" aria-hidden />
    </Link>
  );
}
