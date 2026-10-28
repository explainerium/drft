"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DashboardSummary } from "@/types/admin";
import { useAdminFormat } from "./AdminPage";

type Series = DashboardSummary["series"];

const BRAND = "#2d7811";

/** "2026-10-19" as a calendar date; it is already the shop's day, so no time zone shift. */
export const dayLabel = (date: string, style: "short" | "long") =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    ...(style === "long" ? { weekday: "short" } : {}),
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));

const compactEuro = new Intl.NumberFormat("en", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 1,
});

/**
 * Revenue per day as one smooth filled line (one series, so no legend; the
 * panel title names it), with a crosshair tooltip and the latest day marked.
 */
export function SalesChart({ series }: { series: Series }) {
  const t = useTranslations("admin.dashboard");
  const f = useAdminFormat();
  const gradient = `sales-fill-${useId().replace(/:/g, "")}`;
  const config = { revenue: { label: t("revenue"), color: BRAND } } satisfies ChartConfig;
  const data = series.map((day) => ({ ...day, value: Number(day.revenue) }));
  const empty = data.every((day) => day.value === 0);
  const last = data.length - 1;

  return (
    <div className="relative">
      <ChartContainer config={config} className="aspect-auto h-64 w-full sm:h-72">
        <AreaChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BRAND} stopOpacity={0.22} />
              <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            minTickGap={36}
            tickFormatter={(date: string) => dayLabel(date, "short")}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={52}
            tickFormatter={(value: number) => compactEuro.format(value)}
          />
          <Tooltip
            cursor={{ stroke: BRAND, strokeOpacity: 0.3, strokeWidth: 1 }}
            content={({ active, payload }) => {
              const day = active ? (payload?.[0]?.payload as (typeof data)[number] | undefined) : undefined;
              if (!day) return null;
              return (
                <div className="rounded-xl border bg-popover px-3 py-2 text-xs shadow-lg">
                  <p className="text-muted-foreground">{dayLabel(day.date, "long")}</p>
                  <p className="mt-0.5 font-heading text-sm font-semibold tabular-nums">{f.money(day.revenue)}</p>
                  <p className="text-muted-foreground">{t("ordersCount", { count: day.orders })}</p>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={BRAND}
            strokeWidth={2.25}
            fill={`url(#${gradient})`}
            activeDot={{ r: 4.5, fill: BRAND, stroke: "#fff", strokeWidth: 2 }}
            // Only the latest day gets a resting dot, like a "you are here" marker.
            dot={(props: { cx?: number; cy?: number; index?: number }) =>
              props.index === last && props.cx !== undefined && props.cy !== undefined ? (
                <circle key="last" cx={props.cx} cy={props.cy} r={4.5} fill={BRAND} stroke="#fff" strokeWidth={2} />
              ) : (
                <g key={props.index} />
              )
            }
          />
        </AreaChart>
      </ChartContainer>
      {empty && (
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          {t("noSales")}
        </p>
      )}
    </div>
  );
}

/** The same numbers as a table (shown instead of the chart on request). */
export function SalesTable({ series }: { series: Series }) {
  const t = useTranslations("admin.dashboard");
  const f = useAdminFormat();
  return (
    <div className="max-h-72 overflow-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">{t("date")}</TableHead>
            <TableHead className="text-right">{t("revenue")}</TableHead>
            <TableHead className="pr-4 text-right">{t("orders")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {series.map((day) => (
            <TableRow key={day.date}>
              <TableCell className="pl-4">{dayLabel(day.date, "long")}</TableCell>
              <TableCell className="text-right tabular-nums">{f.money(day.revenue)}</TableCell>
              <TableCell className="pr-4 text-right tabular-nums">{day.orders}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
