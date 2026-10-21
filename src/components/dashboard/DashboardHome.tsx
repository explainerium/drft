"use client";

import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  CalendarIcon,
  ChartAreaIcon,
  ChevronDownIcon,
  DownloadIcon,
  EuroIcon,
  ReceiptIcon,
  ShoppingBagIcon,
  TableIcon,
  UserPlusIcon,
  type LucideIcon,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { ADMIN_LINKS, ADMIN_TIME_ZONE } from "@/constants/admin";
import { cn } from "@/lib/utils";
import { useGetDashboardQuery } from "@/redux/api/adminApi";
import { useSession } from "@/redux/api/authApi";
import type { DashboardRange, DashboardSummary, Metric } from "@/types/admin";
import { QueryError, useAdminFormat } from "./AdminPage";
import { StatusPill } from "./orders/StatusPill";
import { dayLabel, SalesChart, SalesTable } from "./SalesChart";

const RANGES: DashboardRange[] = [7, 30, 90];

/** Time of day and date in the shop's time zone, for the greeting. */
function useGreeting() {
  const format = useFormatter();
  const [now] = useState(() => new Date());
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: ADMIN_TIME_ZONE }).format(now),
  );
  return {
    part: hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening",
    date: format.dateTime(now, { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
  } as const;
}

/** Daily sales of the period as a CSV download. */
function downloadCsv(data: DashboardSummary) {
  const rows = [["date", "revenue_eur", "paid_orders"], ...data.series.map((d) => [d.date, d.revenue, String(d.orders)])];
  const blob = new Blob([rows.map((row) => row.join(",")).join("\n") + "\n"], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `drft-sales-${data.period.from}-to-${data.period.to}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function DashboardHome() {
  const t = useTranslations("admin.dashboard");
  const { user } = useSession();
  const greeting = useGreeting();
  const [days, setDays] = useState<DashboardRange>(30);
  const { data, isLoading, isError, refetch, isFetching } = useGetDashboardQuery(days);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl leading-tight font-semibold tracking-[-0.025em] sm:text-[28px]">
            {t(`greetings.${greeting.part}`, { name: user?.firstName ?? "" })}
          </h1>
          <p className="text-sm text-muted-foreground">{greeting.date}</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 gap-2 bg-card px-3">
                <CalendarIcon className="text-muted-foreground" />
                {t(`rangeLong.${days}`)}
                <ChevronDownIcon className="text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuRadioGroup value={String(days)} onValueChange={(v) => setDays(Number(v) as DashboardRange)}>
                {RANGES.map((range) => (
                  <DropdownMenuRadioItem key={range} value={String(range)}>
                    {t(`rangeLong.${range}`)}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button className="h-9 gap-2 px-3" disabled={!data} onClick={() => data && downloadCsv(data)}>
            <DownloadIcon />
            {t("export")}
          </Button>
        </div>
      </div>

      {isError ? (
        <QueryError onRetry={refetch} />
      ) : !data || isLoading ? (
        <DashboardSkeleton />
      ) : (
        <div className={cn("flex flex-col gap-5 transition-opacity", isFetching && "opacity-70")}>
          <KpiStrip data={data} />
          <div className="grid grid-cols-[minmax(0,1fr)] items-stretch gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <RevenuePanel data={data} />
            <FulfilmentPanel data={data} />
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <div className="flex min-w-0 flex-col gap-5">
              <TopProducts products={data.topProducts} />
              <LowStock lowStock={data.lowStock} />
            </div>
            <RecentOrders orders={data.recentOrders} />
          </div>
        </div>
      )}
    </>
  );
}

function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("panel flex min-w-0 flex-col overflow-hidden", className)}>
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="font-heading text-[15px] font-semibold tracking-[-0.01em]">{title}</h2>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Green up, red down; nothing when the previous period was empty. */
function Change({ metric, days, withNote = true }: { metric: Metric<string> | Metric; days: number; withNote?: boolean }) {
  const t = useTranslations("admin.dashboard");
  const { change } = metric;
  if (change === null) {
    return withNote ? <span className="text-xs text-subtle-foreground">{t("noComparisonShort")}</span> : null;
  }
  const up = change >= 0;
  const Icon = up ? ArrowUpRightIcon : ArrowDownRightIcon;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 text-xs">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium tabular-nums",
          up ? "bg-success/10 text-emerald-700" : "bg-destructive/10 text-destructive",
        )}
      >
        <Icon className="size-3.5" aria-hidden />
        {t("changeValue", { change: Math.abs(change), direction: up ? "up" : "down" })}
      </span>
      {withNote && <span className="text-subtle-foreground">{t("vsPreviousShort", { days })}</span>}
    </span>
  );
}

/** The period in four numbers, and how much of what was paid has shipped. */
function KpiStrip({ data }: { data: DashboardSummary }) {
  const t = useTranslations("admin.dashboard");
  const f = useAdminFormat();
  const days = data.period.days;
  const kpis: { label: string; icon: LucideIcon; value: string; metric: Metric<string> | Metric }[] = [
    { label: t("revenue"), icon: EuroIcon, value: f.money(data.revenue.current), metric: data.revenue },
    { label: t("orders"), icon: ShoppingBagIcon, value: String(data.orders.current), metric: data.orders },
    { label: t("aov"), icon: ReceiptIcon, value: f.money(data.averageOrderValue.current), metric: data.averageOrderValue },
    { label: t("newCustomers"), icon: UserPlusIcon, value: String(data.newCustomers.current), metric: data.newCustomers },
  ];

  return (
    <section aria-label={t("kpis")} className="panel grid grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_15rem]">
      {kpis.map(({ label, icon: Icon, value, metric }, index) => (
        <div
          key={label}
          className={cn(
            "flex min-w-0 flex-col gap-3 px-4 py-4 sm:px-6 sm:py-5",
            index % 2 === 0 && "border-r",
            index < 2 && "border-b xl:border-b-0",
            "xl:border-r",
          )}
        >
          <span className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
            <span className="flex size-7 items-center justify-center rounded-lg bg-brand-soft text-brand">
              <Icon className="size-4" aria-hidden />
            </span>
            {label}
          </span>
          <span className="truncate font-heading text-[22px] leading-none font-semibold tracking-[-0.02em] tabular-nums sm:text-[26px]">
            {value}
          </span>
          <Change metric={metric} days={days} />
        </div>
      ))}
      <ShippedGauge fulfilment={data.fulfilment} />
    </section>
  );
}

/** Half-ring gauge: paid orders of the period that have shipped. */
function ShippedGauge({ fulfilment }: { fulfilment: DashboardSummary["fulfilment"] }) {
  const t = useTranslations("admin.dashboard");
  const percent = fulfilment.shippedPercent ?? 0;
  const paid = fulfilment.delivered + fulfilment.shipped + fulfilment.toShip;
  const r = 52;
  const length = Math.PI * r;
  return (
    <div className="col-span-2 flex flex-col items-center justify-center gap-1 border-t px-5 py-5 xl:col-span-1 xl:border-t-0">
      <div className="relative h-[72px] w-[136px]">
        <svg viewBox="0 0 136 72" className="size-full" role="img" aria-label={t("shippedGauge", { percent })}>
          <path d={`M 16 64 A ${r} ${r} 0 0 1 120 64`} fill="none" stroke="var(--muted)" strokeWidth="12" strokeLinecap="round" />
          {percent > 0 && (
          <path
            d={`M 16 64 A ${r} ${r} 0 0 1 120 64`}
            fill="none"
            stroke="var(--brand)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${(percent / 100) * length} ${length}`}
          />
          )}
        </svg>
        <span className="absolute inset-x-0 bottom-0 text-center font-heading text-2xl font-semibold tabular-nums">
          {fulfilment.shippedPercent === null ? "—" : `${percent}%`}
        </span>
      </div>
      <span className="text-xs font-medium">{t("shippedLabel")}</span>
      <span className="text-xs text-subtle-foreground">
        {t("shippedOf", { shipped: fulfilment.delivered + fulfilment.shipped, paid })}
      </span>
    </div>
  );
}

function RevenuePanel({ data }: { data: DashboardSummary }) {
  const t = useTranslations("admin.dashboard");
  const f = useAdminFormat();
  const [asTable, setAsTable] = useState(false);
  return (
    <Panel
      title={t("revenue")}
      description={`${dayLabel(data.period.from, "short")} – ${dayLabel(data.period.to, "short")}`}
      action={
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setAsTable((v) => !v)}
          aria-label={asTable ? t("showChart") : t("showTable")}
          title={asTable ? t("showChart") : t("showTable")}
        >
          {asTable ? <ChartAreaIcon /> : <TableIcon />}
        </Button>
      }
    >
      <div className="flex flex-wrap items-baseline gap-3 px-5">
        <span className="font-heading text-[30px] leading-none font-semibold tracking-[-0.025em] tabular-nums">
          {f.money(data.revenue.current)}
        </span>
        <Change metric={data.revenue} days={data.period.days} withNote={false} />
      </div>
      <div className="px-3 pt-3 pb-4 sm:px-4">
        {asTable ? <SalesTable series={data.series} /> : <SalesChart series={data.series} />}
      </div>
    </Panel>
  );
}

/** Where this period's orders stand now, as shares of all of them. */
function FulfilmentPanel({ data }: { data: DashboardSummary }) {
  const t = useTranslations("admin.dashboard");
  const { fulfilment } = data;
  const rows = [
    { key: "delivered", count: fulfilment.delivered, bar: "bg-brand" },
    { key: "shipped", count: fulfilment.shipped, bar: "bg-[#2b8fc2]" },
    { key: "toShip", count: fulfilment.toShip, bar: "bg-[#7cbfe0]" },
    { key: "awaitingPayment", count: fulfilment.awaitingPayment, bar: "bg-[#e0a24a]" },
    { key: "cancelled", count: fulfilment.cancelled, bar: "bg-[#d97a7a]" },
  ] as const;
  const share = (count: number) => (fulfilment.total ? Math.round((count / fulfilment.total) * 100) : 0);

  return (
    <Panel title={t("fulfilment")} description={t("fulfilmentHint", { count: fulfilment.total })}>
      <ul className="flex flex-1 flex-col gap-4 px-5 pt-1 pb-5">
        {rows.map((row) => (
          <li key={row.key} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">{t(`stages.${row.key}`)}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {t("stageCount", { count: row.count, percent: share(row.count) })}
              </span>
            </div>
            <span className="h-2 overflow-hidden rounded-full bg-muted">
              <span className={cn("block h-full rounded-full", row.bar)} style={{ width: `${share(row.count)}%` }} />
            </span>
          </li>
        ))}
      </ul>
      <dl className="grid grid-cols-2 border-t">
        <Link
          href={`${ADMIN_LINKS.orders}?status=PAID`}
          className="flex flex-col gap-0.5 border-r px-5 py-4 transition-colors hover:bg-accent/60"
        >
          <dd className="font-heading text-xl font-semibold tabular-nums">{data.toFulfil}</dd>
          <dt className="text-xs text-muted-foreground">{t("waitingToShip")}</dt>
        </Link>
        <Link
          href={`${ADMIN_LINKS.orders}?status=PENDING_PAYMENT`}
          className="flex flex-col gap-0.5 px-5 py-4 transition-colors hover:bg-accent/60"
        >
          <dd className="font-heading text-xl font-semibold tabular-nums">{data.awaitingPayment}</dd>
          <dt className="text-xs text-muted-foreground">{t("awaitingPayment")}</dt>
        </Link>
      </dl>
    </Panel>
  );
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");

function TopProducts({ products }: { products: DashboardSummary["topProducts"] }) {
  const t = useTranslations("admin.dashboard");
  const f = useAdminFormat();
  return (
    <Panel
      title={t("topProducts")}
      action={
        <Link href={ADMIN_LINKS.products} className="text-xs font-medium text-muted-foreground hover:text-foreground">
          {t("viewAll")}
        </Link>
      }
    >
      {products.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-muted-foreground">{t("noTopProducts")}</p>
      ) : (
        <ul className="pb-2">
          {products.map((product) => {
            const row = (
              <>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted font-heading text-xs font-semibold text-muted-foreground">
                  {initials(product.productName)}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{product.productName}</span>
                <span className="flex flex-col items-end">
                  <span className="text-sm font-semibold tabular-nums">{f.money(product.revenue)}</span>
                  <span className="text-xs text-muted-foreground">{t("unitsSold", { count: product.units })}</span>
                </span>
              </>
            );
            return (
              <li key={product.productId ?? product.productName} className="border-t first:border-t-0">
                {product.productId ? (
                  <Link
                    href={ADMIN_LINKS.product(product.productId)}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-accent/60"
                  >
                    {row}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 px-5 py-3">{row}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function LowStock({ lowStock }: { lowStock: DashboardSummary["lowStock"] }) {
  const t = useTranslations("admin.dashboard");
  return (
    <Panel title={t("lowStock")} description={t("lowStockHint", { threshold: lowStock.threshold })}>
      {lowStock.items.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-muted-foreground">{t("noLowStock")}</p>
      ) : (
        <ul className="pb-2">
          {lowStock.items.map((item) => (
            <li key={item.variantId} className="border-t first:border-t-0">
              <Link
                href={ADMIN_LINKS.product(item.productId)}
                className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-accent/60"
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm">{item.productName}</span>
                  {(item.options || item.sku) && (
                    <span className="truncate text-xs text-muted-foreground">{item.options || item.sku}</span>
                  )}
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap tabular-nums",
                    item.stock === 0 ? "bg-destructive/10 text-destructive" : "bg-signal-soft text-signal",
                  )}
                >
                  {item.stock === 0
                    ? item.allowBackorder
                      ? t("backorder")
                      : t("soldOut")
                    : t("stockLeft", { count: item.stock })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function RecentOrders({ orders }: { orders: DashboardSummary["recentOrders"] }) {
  const t = useTranslations("admin.dashboard");
  const f = useAdminFormat();
  return (
    <Panel
      title={t("recent")}
      action={
        <Link href={ADMIN_LINKS.orders} className="text-xs font-medium text-muted-foreground hover:text-foreground">
          {t("viewAll")}
        </Link>
      }
    >
      {orders.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-muted-foreground">{t("noOrders")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-y bg-muted/60 text-left text-xs text-muted-foreground">
                <th className="py-2.5 pr-3 pl-5 font-medium">{t("columns.order")}</th>
                <th className="px-3 py-2.5 font-medium">{t("columns.customer")}</th>
                <th className="px-3 py-2.5 font-medium">{t("columns.product")}</th>
                <th className="px-3 py-2.5 font-medium">{t("columns.status")}</th>
                <th className="px-3 py-2.5 text-right font-medium">{t("columns.total")}</th>
                <th className="py-2.5 pr-5 pl-3 text-right font-medium">{t("columns.date")}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const name = order.customer.name || order.customer.email;
                return (
                  <tr key={order.id} className="border-b transition-colors last:border-b-0 hover:bg-accent/50">
                    <td className="py-3 pr-3 pl-5">
                      <Link href={ADMIN_LINKS.order(order.id)} className="font-medium tabular-nums hover:underline">
                        {order.number}
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      <span className="flex items-center gap-2.5">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                          {initials(name)}
                        </span>
                        <span className="max-w-40 truncate">{name}</span>
                      </span>
                    </td>
                    <td className="max-w-52 truncate px-3 py-3 text-muted-foreground">
                      {order.firstProduct
                        ? order.itemCount > 1
                          ? t("productMore", { name: order.firstProduct, count: order.itemCount - 1 })
                          : order.firstProduct
                        : "—"}
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill status={order.status} />
                    </td>
                    <td className="px-3 py-3 text-right font-medium tabular-nums">
                      {f.money(order.total, order.currency)}
                    </td>
                    <td className="py-3 pr-5 pl-3 text-right whitespace-nowrap text-muted-foreground">
                      {f.date(order.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-5">
      <Skeleton className="h-36 rounded-2xl" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </div>
  );
}
