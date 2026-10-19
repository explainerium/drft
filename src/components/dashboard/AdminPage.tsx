"use client";

import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon, RotateCwIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { PageMeta } from "@/types/checkout";
import { formatPrice } from "@/utils/format";

/** Title row of an admin page, with an optional back link and actions on the right. */
export function PageHeader({
  title,
  description,
  back,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      {back && (
        <Link
          href={back.href}
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="font-heading text-2xl font-medium tracking-[-0.02em] sm:text-[28px]">{title}</h1>
          {description && <div className="text-sm text-muted-foreground">{description}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function QueryError({ onRetry, message }: { onRetry: () => void; message?: string }) {
  const t = useTranslations("admin.common");
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-xl bg-card p-6 text-sm ring-1 ring-foreground/10"
    >
      <p>{message ?? t("error")}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RotateCwIcon />
        {t("retry")}
      </Button>
    </div>
  );
}

export function Pagination({ meta, onPage }: { meta: PageMeta; onPage: (page: number) => void }) {
  const t = useTranslations("admin.common");
  if (meta.totalPages <= 1) return null;
  return (
    <nav aria-label={t("pagination")} className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{t("page", { page: meta.page, pages: meta.totalPages })}</span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>
          <ChevronLeftIcon />
          {t("previous")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPage(meta.page + 1)}
        >
          {t("next")}
          <ChevronRightIcon />
        </Button>
      </div>
    </nav>
  );
}

/** Admin formatting: money with cents, dates in the shop's time zone (set on the intl provider). */
export function useAdminFormat() {
  const format = useFormatter();
  return {
    money: (amount: string, currency = "EUR") => formatPrice(amount, "en", currency, { cents: true }),
    date: (value: string | Date) => format.dateTime(new Date(value), { dateStyle: "medium" }),
    dateTime: (value: string | Date) =>
      format.dateTime(new Date(value), { dateStyle: "medium", timeStyle: "short" }),
    time: (value: string | Date) => format.dateTime(new Date(value), { timeStyle: "short" }),
  };
}
