"use client";

import { DownloadIcon, SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { StatusPill } from "@/components/dashboard/orders/StatusPill";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ADMIN_LINKS } from "@/constants/admin";
import { cn } from "@/lib/utils";
import { useGetAdminOrdersQuery, useGetOrderCountsQuery } from "@/redux/api/adminApi";
import type { AdminOrderRow } from "@/types/admin";
import type { OrderStatus } from "@/types/checkout";
import { PageHeader, Pagination, QueryError, useAdminFormat } from "../AdminPage";
import { SearchBox } from "../SearchBox";
import { OrderExportDialog } from "./OrderExportDialog";

/** Filter chips in the order staff work through them. */
const STATUSES: OrderStatus[] = [
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "PENDING_PAYMENT",
  "CANCELLED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
];

const isStatus = (value: string | null): value is OrderStatus => !!value && (STATUSES as string[]).includes(value);

/** The order list. Filters live in the URL (?status=&q=&page=) so a filtered view can be shared or reloaded. */
export function OrdersView() {
  const t = useTranslations("admin.orders");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const statusParam = searchParams.get("status");
  const status = isStatus(statusParam) ? statusParam : undefined;
  const search = searchParams.get("q") ?? "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const setParams = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const { data, isLoading, isError, isFetching, refetch } = useGetAdminOrdersQuery({ page, search, status });
  const { data: counts } = useGetOrderCountsQuery();
  const total = counts ? Object.values(counts).reduce((sum, count) => sum + count, 0) : undefined;
  const [exporting, setExporting] = useState(false);

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Button variant="outline" onClick={() => setExporting(true)}>
            <DownloadIcon />
            {t("export.button")}
          </Button>
        }
      />
      {/* Mounted only while open, so it starts from the current filter each time. */}
      {exporting && (
        <OrderExportDialog open onOpenChange={setExporting} statuses={STATUSES} initialStatus={status} />
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="scrollbar-none -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div role="group" aria-label={t("filter")} className="flex w-max gap-1.5">
            <StatusChip active={!status} label={t("all")} count={total} onClick={() => setParams({ status: undefined, page: undefined })} />
            {STATUSES.map((value) => (
              <StatusChip
                key={value}
                active={status === value}
                label={t(`status.${value}`)}
                count={counts?.[value]}
                onClick={() => setParams({ status: value, page: undefined })}
              />
            ))}
          </div>
        </div>
        <SearchBox
          key={search}
          defaultValue={search}
          placeholder={t("search")}
          onSearch={(q) => setParams({ q: q || undefined, page: undefined })}
          className="lg:w-80"
        />
      </div>

      {isError ? (
        <QueryError onRetry={refetch} />
      ) : (
        <div className="overflow-hidden panel">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">{t("columns.order")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("columns.date")}</TableHead>
                <TableHead className="hidden sm:table-cell">{t("columns.customer")}</TableHead>
                <TableHead>{t("columns.status")}</TableHead>
                <TableHead className="pr-4 text-right">{t("columns.total")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className={cn("transition-opacity", isFetching && !isLoading && "opacity-60")}>
              {isLoading || !data ? (
                <SkeletonRows />
              ) : data.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    <SearchIcon className="mx-auto mb-2 size-5" aria-hidden />
                    {t("empty")}
                  </TableCell>
                </TableRow>
              ) : (
                data.data.map((order) => <OrderRow key={order.id} order={order} />)
              )}
            </TableBody>
          </Table>
        </div>
      )}
      {data && <Pagination meta={data.meta} onPage={(next) => setParams({ page: next > 1 ? String(next) : undefined })} />}
    </>
  );
}

function StatusChip({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        active ? "border-abyss bg-abyss text-white" : "border-border bg-card hover:bg-accent",
      )}
    >
      {label}
      {count !== undefined && (
        <span className={cn("text-xs tabular-nums", active ? "text-primary-foreground/70" : "text-muted-foreground")}>
          {count}
        </span>
      )}
    </button>
  );
}

function OrderRow({ order }: { order: AdminOrderRow }) {
  const t = useTranslations("admin.orders");
  const f = useAdminFormat();
  const router = useRouter();
  const href = ADMIN_LINKS.order(order.id);

  return (
    <TableRow className="cursor-pointer" onClick={() => router.push(href)}>
      <TableCell className="pl-4">
        {/* The real link, for keyboard and middle-click; the row click is a shortcut. */}
        <Link href={href} onClick={(event) => event.stopPropagation()} className="font-medium hover:underline">
          {order.number}
        </Link>
        <div className="text-xs text-muted-foreground">{t("items", { count: order.itemCount })}</div>
        <div className="text-xs text-muted-foreground md:hidden">{f.date(order.createdAt)}</div>
        <div className="max-w-40 truncate text-xs text-muted-foreground sm:hidden">
          {order.customer.name || order.customer.email}
        </div>
      </TableCell>
      <TableCell className="hidden text-muted-foreground md:table-cell">{f.dateTime(order.createdAt)}</TableCell>
      <TableCell className="hidden max-w-56 sm:table-cell">
        <div className="truncate">{order.customer.name || order.customer.email}</div>
        <div className="truncate text-xs text-muted-foreground">
          {order.customer.isRegistered ? order.customer.email : t("guest", { email: order.customer.email })}
        </div>
      </TableCell>
      <TableCell>
        <StatusPill status={order.status} />
      </TableCell>
      <TableCell className="pr-4 text-right font-medium tabular-nums">{f.money(order.total, order.currency)}</TableCell>
    </TableRow>
  );
}

function SkeletonRows() {
  return Array.from({ length: 6 }, (_, index) => (
    <TableRow key={index}>
      <TableCell colSpan={5} className="px-4">
        <Skeleton className="h-9 w-full" />
      </TableCell>
    </TableRow>
  ));
}
