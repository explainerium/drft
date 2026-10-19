"use client";

import { SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ADMIN_LINKS } from "@/constants/admin";
import { cn } from "@/lib/utils";
import { useGetCustomersQuery } from "@/redux/api/adminApi";
import type { CustomerRow } from "@/types/admin";
import { PageHeader, Pagination, QueryError, useAdminFormat } from "../AdminPage";
import { SearchBox } from "../SearchBox";
import { AccountStatusBadge } from "./AccountStatusBadge";

const STATUSES = ["ACTIVE", "SUSPENDED"] as const;
type Status = (typeof STATUSES)[number];

const isStatus = (value: string | null): value is Status => !!value && (STATUSES as readonly string[]).includes(value);

/** Customer accounts. Filters live in the URL (?status=&q=&page=). */
export function CustomersView() {
  const t = useTranslations("admin.customers");
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

  const { data, isLoading, isError, isFetching, refetch } = useGetCustomersQuery({ page, search, status });

  return (
    <>
      <PageHeader title={t("title")} description={t("subtitle")} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="group" aria-label={t("filter")} className="flex gap-1.5">
          {[undefined, ...STATUSES].map((value) => (
            <button
              key={value ?? "all"}
              type="button"
              aria-pressed={status === value}
              onClick={() => setParams({ status: value, page: undefined })}
              className={cn(
                "inline-flex h-8 items-center rounded-full px-3 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                status === value ? "bg-primary text-primary-foreground" : "bg-card ring-1 ring-foreground/10 hover:bg-accent",
              )}
            >
              {value ? t(`status.${value}`) : t("all")}
            </button>
          ))}
        </div>
        <SearchBox
          key={search}
          defaultValue={search}
          placeholder={t("search")}
          onSearch={(q) => setParams({ q: q || undefined, page: undefined })}
          className="sm:w-80"
        />
      </div>

      {isError ? (
        <QueryError onRetry={refetch} />
      ) : (
        <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">{t("columns.name")}</TableHead>
                <TableHead>{t("columns.status")}</TableHead>
                <TableHead className="text-right">{t("columns.orders")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("columns.joined")}</TableHead>
                <TableHead className="hidden pr-4 lg:table-cell">{t("columns.lastLogin")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className={cn("transition-opacity", isFetching && !isLoading && "opacity-60")}>
              {isLoading || !data ? (
                Array.from({ length: 6 }, (_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={5} className="px-4">
                      <Skeleton className="h-9 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : data.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    <SearchIcon className="mx-auto mb-2 size-5" aria-hidden />
                    {t("empty")}
                  </TableCell>
                </TableRow>
              ) : (
                data.data.map((customer) => <CustomerTableRow key={customer.id} customer={customer} />)
              )}
            </TableBody>
          </Table>
        </div>
      )}
      {data && <Pagination meta={data.meta} onPage={(next) => setParams({ page: next > 1 ? String(next) : undefined })} />}
    </>
  );
}

function CustomerTableRow({ customer }: { customer: CustomerRow }) {
  const t = useTranslations("admin.customers");
  const f = useAdminFormat();
  const router = useRouter();
  const href = ADMIN_LINKS.customer(customer.id);
  const name = `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim();

  return (
    <TableRow className="cursor-pointer" onClick={() => router.push(href)}>
      <TableCell className="max-w-64 pl-4">
        <Link href={href} onClick={(event) => event.stopPropagation()} className="block truncate font-medium hover:underline">
          {name || customer.email}
        </Link>
        <div className="truncate text-xs text-muted-foreground">{customer.email}</div>
      </TableCell>
      <TableCell>
        <AccountStatusBadge status={customer.status} verified={!!customer.emailVerifiedAt} />
      </TableCell>
      <TableCell className="text-right tabular-nums">{customer.orderCount}</TableCell>
      <TableCell className="hidden text-muted-foreground md:table-cell">{f.date(customer.createdAt)}</TableCell>
      <TableCell className="hidden pr-4 text-muted-foreground lg:table-cell">
        {customer.lastLoginAt ? f.dateTime(customer.lastLoginAt) : t("never")}
      </TableCell>
    </TableRow>
  );
}
