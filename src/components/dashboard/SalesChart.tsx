"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DashboardSummary } from "@/types/admin";
import { useAdminFormat } from "./AdminPage";

type Series = DashboardSummary["series"];

/** "2026-10-19" as a calendar date; it is already the shop's day, so no time zone shift. */
const dayLabel = (date: string, style: "short" | "long") =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    ...(style === "long" ? { weekday: "short" } : {}),
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));

/** Revenue per day as bars (one series, so no legend), with a table view of the same numbers. */
export function SalesChart({ series }: { series: Series }) {
  const t = useTranslations("admin.dashboard");
  const f = useAdminFormat();
  const [asTable, setAsTable] = useState(false);
  const config = { revenue: { label: t("revenue"), color: "var(--brand)" } } satisfies ChartConfig;
  const data = series.map((day) => ({ ...day, value: Number(day.revenue) }));
  const empty = data.every((day) => day.value === 0);

  return (
    <div className="flex flex-col gap-3">
      {asTable ? (
        <div className="max-h-80 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("date")}</TableHead>
                <TableHead className="text-right">{t("revenue")}</TableHead>
                <TableHead className="text-right">{t("orders")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {series.map((day) => (
                <TableRow key={day.date}>
                  <TableCell>{dayLabel(day.date, "long")}</TableCell>
                  <TableCell className="text-right tabular-nums">{f.money(day.revenue)}</TableCell>
                  <TableCell className="text-right tabular-nums">{day.orders}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="relative">
          <ChartContainer config={config} className="aspect-auto h-64 w-full sm:h-72">
            <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }} barCategoryGap={2}>
              <CartesianGrid vertical={false} strokeDasharray="0" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
                tickFormatter={(date: string) => dayLabel(date, "short")}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={56}
                tickFormatter={(value: number) =>
                  new Intl.NumberFormat("en", {
                    style: "currency",
                    currency: "EUR",
                    notation: "compact",
                    maximumFractionDigits: 1,
                  }).format(value)
                }
              />
              <Tooltip
                cursor={{ fill: "var(--accent)" }}
                content={({ active, payload }) => {
                  const day = active ? (payload?.[0]?.payload as (typeof data)[number] | undefined) : undefined;
                  if (!day) return null;
                  return (
                    <div className="rounded-lg bg-popover px-3 py-2 text-xs shadow-md ring-1 ring-foreground/10">
                      <p className="font-medium">{dayLabel(day.date, "long")}</p>
                      <p className="mt-1 tabular-nums">
                        <span className="mr-1.5 inline-block size-2 rounded-[2px] bg-brand align-middle" />
                        {f.money(day.revenue)}
                      </p>
                      <p className="text-muted-foreground">{t("ordersCount", { count: day.orders })}</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="value" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ChartContainer>
          {empty && (
            <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
              {t("noSales")}
            </p>
          )}
        </div>
      )}
      <Button variant="ghost" size="sm" className="self-start" onClick={() => setAsTable((v) => !v)}>
        {asTable ? t("showChart") : t("showTable")}
      </Button>
    </div>
  );
}
