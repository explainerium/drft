"use client";

import { ArrowRightIcon, PackageIcon } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { OrderStatusBadge } from "@/components/checkout/OrderStatusBadge";
import { ACCOUNT_LINKS } from "@/constants/navigation";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useGetMyOrdersQuery } from "@/redux/api/accountApi";
import type { OrderSummary } from "@/types/checkout";
import { formatPrice } from "@/utils/format";

/** /account/orders: the customer's orders, newest first, ten per page (?page=). */
export function OrderHistory() {
  const t = useTranslations("account.orders");
  const page = Math.max(1, Number(useSearchParams().get("page")) || 1);
  const { data, isLoading, isError, refetch } = useGetMyOrdersQuery({ page });

  return (
    <>
      <h1 className="font-heading text-3xl font-medium tracking-[-0.025em] sm:text-4xl">{t("title")}</h1>
      {isLoading ? (
        <div aria-hidden className="flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-md bg-card" />
          ))}
        </div>
      ) : isError || !data ? (
        <div className="flex flex-col items-start gap-3 rounded-md bg-card p-6 shadow-xs">
          <p className="text-sm text-muted-foreground">{t("error")}</p>
          <button type="button" onClick={() => refetch()} className="text-sm font-medium underline">
            {t("retry")}
          </button>
        </div>
      ) : data.orders.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-md bg-card px-5 py-14 text-center shadow-xs">
          <PackageIcon className="size-8 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
          <Link
            href="/shop"
            className="inline-flex h-12 items-center gap-2 rounded-sm bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/85"
          >
            {t("emptyCta")}
            <ArrowRightIcon className="size-4" aria-hidden />
          </Link>
        </div>
      ) : (
        <>
          <ul className="flex flex-col gap-4">
            {data.orders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </ul>
          {data.meta.totalPages > 1 && <Pager page={page} totalPages={data.meta.totalPages} />}
        </>
      )}
    </>
  );
}

function OrderRow({ order }: { order: OrderSummary }) {
  const t = useTranslations("account.orders");
  const locale = useLocale();
  const format = useFormatter();
  const extra = order.itemCount - order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <li>
      <Link
        href={`${ACCOUNT_LINKS.orders}/${order.id}`}
        className="flex flex-col gap-4 rounded-md bg-card p-5 shadow-xs transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-heading text-lg font-semibold tracking-[-0.01em]">{order.number}</span>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {t("placed", { date: format.dateTime(new Date(order.createdAt), { dateStyle: "medium" }) })} ·{" "}
            {t("items", { count: order.itemCount })}
          </p>
        </div>
        <div className="flex items-center justify-between gap-6 sm:justify-end">
          <div className="flex -space-x-3">
            {order.items.map((item, i) => (
              <span
                key={i}
                className="size-12 overflow-hidden rounded-sm border-2 border-card bg-secondary"
                title={item.productName}
              >
                {item.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt="" loading="lazy" className="size-full object-cover" />
                )}
              </span>
            ))}
            {extra > 0 && (
              <span className="flex size-12 items-center justify-center rounded-sm border-2 border-card bg-secondary text-xs font-medium">
                {t("more", { count: extra })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-semibold">{formatPrice(order.total, locale, order.currency, { cents: true })}</span>
            <ArrowRightIcon className="size-4 text-muted-foreground" aria-label={t("view")} />
          </div>
        </div>
      </Link>
    </li>
  );
}

function Pager({ page, totalPages }: { page: number; totalPages: number }) {
  const t = useTranslations("account.orders");
  const link = (target: number, label: string, disabled: boolean) => (
    <Link
      href={target === 1 ? ACCOUNT_LINKS.orders : `${ACCOUNT_LINKS.orders}?page=${target}`}
      aria-disabled={disabled}
      className={cn(
        "rounded-sm bg-card px-4 py-2 text-sm font-medium shadow-xs hover:bg-accent",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      {label}
    </Link>
  );

  return (
    <nav className="flex items-center justify-between gap-4">
      {link(page - 1, t("previous"), page <= 1)}
      <span className="text-sm text-muted-foreground">{t("page", { page, total: totalPages })}</span>
      {link(page + 1, t("next"), page >= totalPages)}
    </nav>
  );
}
