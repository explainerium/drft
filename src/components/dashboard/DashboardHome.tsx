"use client";

import { ArrowDownRightIcon, ArrowUpRightIcon, ClockIcon, PackageIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { OrderStatusBadge } from "@/components/checkout/OrderStatusBadge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ADMIN_LINKS } from "@/constants/admin";
import { cn } from "@/lib/utils";
import { useGetDashboardQuery } from "@/redux/api/adminApi";
import { useSession } from "@/redux/api/authApi";
import type { DashboardRange, DashboardSummary, Metric } from "@/types/admin";
import { PageHeader, QueryError, useAdminFormat } from "./AdminPage";
import { SalesChart } from "./SalesChart";

const RANGES: DashboardRange[] = [7, 30, 90];

export function DashboardHome() {
  const t = useTranslations("admin.dashboard");
  const { user } = useSession();
  const [days, setDays] = useState<DashboardRange>(30);
  const { data, isLoading, isError, refetch, isFetching } = useGetDashboardQuery(days);

  return (
    <>
      <PageHeader
        title={user?.firstName ? t("greeting", { name: user.firstName }) : t("title")}
        description={t("subtitle")}
        actions={
          <Tabs value={String(days)} onValueChange={(value) => setDays(Number(value) as DashboardRange)}>
            <TabsList aria-label={t("rangeLabel")}>
              {RANGES.map((range) => (
                <TabsTrigger key={range} value={String(range)}>
                  {t(`range.${range}`)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        }
      />
      {isError ? (
        <QueryError onRetry={refetch} />
      ) : !data || isLoading ? (
        <DashboardSkeleton />
      ) : (
        <div className={cn("flex flex-col gap-6 transition-opacity", isFetching && "opacity-60")}>
          <Summary data={data} />
        </div>
      )}
    </>
  );
}

function Summary({ data }: { data: DashboardSummary }) {
  const t = useTranslations("admin.dashboard");
  const f = useAdminFormat();
  const days = data.period.days;

  return (
    <>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t("revenue")} value={f.money(data.revenue.current)} metric={data.revenue} days={days} />
        <KpiCard label={t("orders")} value={String(data.orders.current)} metric={data.orders} days={days} />
        <KpiCard
          label={t("aov")}
          value={f.money(data.averageOrderValue.current)}
          metric={data.averageOrderValue}
          days={days}
        />
        <KpiCard
          label={t("newCustomers")}
          value={String(data.newCustomers.current)}
          metric={data.newCustomers}
          days={days}
        />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
        <WorkTile
          href={`${ADMIN_LINKS.orders}?status=PAID`}
          icon={<PackageIcon className="size-5" />}
          label={t("toFulfil")}
          hint={t("toFulfilHint")}
          count={data.toFulfil}
        />
        <WorkTile
          href={`${ADMIN_LINKS.orders}?status=PENDING_PAYMENT`}
          icon={<ClockIcon className="size-5" />}
          label={t("awaitingPayment")}
          hint={t("awaitingHint")}
          count={data.awaitingPayment}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("sales")}</CardTitle>
          <CardDescription>{t("salesHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          <SalesChart series={data.series} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <RecentOrders orders={data.recentOrders} />
        <div className="flex flex-col gap-4">
          <LowStock lowStock={data.lowStock} />
          <TopProducts products={data.topProducts} />
        </div>
      </div>
    </>
  );
}

function KpiCard({
  label,
  value,
  metric,
  days,
}: {
  label: string;
  value: string;
  metric: Metric<string> | Metric;
  days: number;
}) {
  const t = useTranslations("admin.dashboard");
  const { change } = metric;
  const up = change !== null && change >= 0;
  const Icon = up ? ArrowUpRightIcon : ArrowDownRightIcon;

  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <p className="font-heading text-2xl font-medium tabular-nums">{value}</p>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">
        {change === null ? (
          t("noComparison", { days })
        ) : (
          <span className="inline-flex flex-wrap items-center gap-1">
            <span className={cn("inline-flex items-center font-medium", up ? "text-emerald-700" : "text-destructive")}>
              <Icon className="size-3.5" aria-hidden />
              {t("changeValue", { change: Math.abs(change), direction: up ? "up" : "down" })}
            </span>
            {t("vsPrevious", { days })}
          </span>
        )}
      </CardContent>
    </Card>
  );
}

function WorkTile({
  href,
  icon,
  label,
  hint,
  count,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  hint: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-colors outline-none hover:bg-accent/60 focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg",
          count > 0 ? "bg-brand-soft text-brand" : "bg-secondary text-muted-foreground",
        )}
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </span>
      <span className="font-heading text-2xl font-medium tabular-nums">{count}</span>
    </Link>
  );
}

function RecentOrders({ orders }: { orders: DashboardSummary["recentOrders"] }) {
  const t = useTranslations("admin.dashboard");
  const f = useAdminFormat();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("recent")}</CardTitle>
        <CardAction>
          <Link href={ADMIN_LINKS.orders} className="text-sm font-medium text-brand hover:underline">
            {t("viewAll")}
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent className="px-0">
        {orders.length === 0 ? (
          <p className="px-4 text-sm text-muted-foreground">{t("noOrders")}</p>
        ) : (
          <ul className="divide-y">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={ADMIN_LINKS.order(order.id)}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 transition-colors hover:bg-accent/60"
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-medium">{order.number}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {order.customer.name || order.customer.email} · {f.dateTime(order.createdAt)}
                    </span>
                  </span>
                  <OrderStatusBadge status={order.status} />
                  <span className="w-24 text-right text-sm font-medium tabular-nums">
                    {f.money(order.total, order.currency)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function LowStock({ lowStock }: { lowStock: DashboardSummary["lowStock"] }) {
  const t = useTranslations("admin.dashboard");
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{t("lowStock")}</CardTitle>
        <CardDescription>{t("lowStockHint", { threshold: lowStock.threshold })}</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {lowStock.items.length === 0 ? (
          <p className="px-3 text-sm text-muted-foreground">{t("noLowStock")}</p>
        ) : (
          <ul className="divide-y">
            {lowStock.items.map((item) => (
              <li key={item.variantId} className="flex items-center gap-3 px-3 py-2.5">
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">{item.productName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {[item.options, item.sku].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span
                  className={cn(
                    "rounded-sm px-2 py-0.5 text-xs font-medium whitespace-nowrap",
                    item.stock === 0 ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-amber-800",
                  )}
                >
                  {item.stock === 0
                    ? item.allowBackorder
                      ? t("backorder")
                      : t("soldOut")
                    : t("stockLeft", { count: item.stock })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function TopProducts({ products }: { products: DashboardSummary["topProducts"] }) {
  const t = useTranslations("admin.dashboard");
  const f = useAdminFormat();
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{t("topProducts")}</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {products.length === 0 ? (
          <p className="px-3 text-sm text-muted-foreground">{t("noTopProducts")}</p>
        ) : (
          <ol className="divide-y">
            {products.map((product, index) => (
              <li key={product.productId ?? product.productName} className="flex items-center gap-3 px-3 py-2.5">
                <span className="w-4 text-xs text-muted-foreground tabular-nums">{index + 1}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{product.productName}</span>
                <span className="text-xs text-muted-foreground">{t("units", { count: product.units })}</span>
                <span className="w-24 text-right text-sm tabular-nums">{f.money(product.revenue)}</span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((key) => (
          <Skeleton key={key} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}
