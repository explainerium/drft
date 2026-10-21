"use client";

import { ImageIcon, PlusIcon, SearchIcon, StarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ADMIN_LINKS } from "@/constants/admin";
import { cn } from "@/lib/utils";
import { useGetAdminProductsQuery } from "@/redux/api/adminCatalogApi";
import type { AdminProductRow, ProductStatus } from "@/types/adminCatalog";
import { PageHeader, Pagination, QueryError, useAdminFormat } from "../AdminPage";
import { SearchBox } from "../SearchBox";
import { ProductStatusBadge } from "./ProductStatusBadge";

const STATUSES: ProductStatus[] = ["PUBLISHED", "DRAFT", "ARCHIVED"];

const isStatus = (value: string | null): value is ProductStatus =>
  !!value && (STATUSES as string[]).includes(value);

/** The catalog. Filters live in the URL (?status=&q=&page=). */
export function ProductsView() {
  const t = useTranslations("admin.products");
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

  const { data, isLoading, isError, isFetching, refetch } = useGetAdminProductsQuery({
    page,
    search,
    status,
    sortBy: "updatedAt",
    sortOrder: "desc",
  });

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Button asChild>
            <Link href={ADMIN_LINKS.newProduct}>
              <PlusIcon />
              {t("new")}
            </Link>
          </Button>
        }
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="group" aria-label={t("filter")} className="flex flex-wrap gap-1.5">
          {[undefined, ...STATUSES].map((value) => (
            <button
              key={value ?? "all"}
              type="button"
              aria-pressed={status === value}
              onClick={() => setParams({ status: value, page: undefined })}
              className={cn(
                "inline-flex h-8 items-center rounded-full border px-3 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                status === value
                  ? "border-abyss bg-abyss text-white"
                  : "border-border bg-card hover:bg-accent",
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
        <div className="overflow-hidden panel">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">{t("columns.product")}</TableHead>
                <TableHead>{t("columns.status")}</TableHead>
                <TableHead className="hidden lg:table-cell">{t("columns.categories")}</TableHead>
                <TableHead className="hidden text-right sm:table-cell">{t("columns.price")}</TableHead>
                <TableHead className="hidden text-right md:table-cell">{t("columns.stock")}</TableHead>
                <TableHead className="hidden pr-4 xl:table-cell">{t("columns.updated")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className={cn("transition-opacity", isFetching && !isLoading && "opacity-60")}>
              {isLoading || !data ? (
                Array.from({ length: 6 }, (_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={6} className="px-4">
                      <Skeleton className="h-11 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : data.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    <SearchIcon className="mx-auto mb-2 size-5" aria-hidden />
                    {t("empty")}
                  </TableCell>
                </TableRow>
              ) : (
                data.data.map((product) => <ProductTableRow key={product.id} product={product} />)
              )}
            </TableBody>
          </Table>
        </div>
      )}
      {data && (
        <Pagination meta={data.meta} onPage={(next) => setParams({ page: next > 1 ? String(next) : undefined })} />
      )}
    </>
  );
}

function ProductTableRow({ product }: { product: AdminProductRow }) {
  const t = useTranslations("admin.products");
  const f = useAdminFormat();
  const router = useRouter();
  const href = ADMIN_LINKS.product(product.id);
  const image = product.featuredImage;
  const { min, max } = product.price;

  return (
    <TableRow className="cursor-pointer" onClick={() => router.push(href)}>
      <TableCell className="max-w-72 pl-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-secondary">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image.sizes.thumb?.url ?? image.url} alt="" className="size-full object-cover" />
            ) : (
              <ImageIcon className="size-4 text-muted-foreground" aria-hidden />
            )}
          </div>
          <div className="min-w-0">
            <Link
              href={href}
              onClick={(event) => event.stopPropagation()}
              className="flex items-center gap-1.5 font-medium hover:underline"
            >
              <span className="truncate">{product.name}</span>
              {product.isFeatured && (
                <StarIcon className="size-3.5 shrink-0 fill-current text-amber-500" aria-label={t("featured")} />
              )}
            </Link>
            <div className="truncate text-xs text-muted-foreground">
              {t("variants", { count: product.variantCount })}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <ProductStatusBadge status={product.status} />
      </TableCell>
      <TableCell className="hidden max-w-48 truncate text-muted-foreground lg:table-cell">
        {product.categories.map((category) => category.name).join(", ") || "—"}
      </TableCell>
      <TableCell className="hidden text-right tabular-nums sm:table-cell">
        {min === null ? "—" : min === max ? f.money(min) : `${f.money(min)} – ${f.money(max!)}`}
      </TableCell>
      <TableCell className="hidden text-right tabular-nums md:table-cell">
        <span className={product.inStock ? undefined : "text-destructive"}>
          {product.inStock ? product.totalStock : t("outOfStock")}
        </span>
      </TableCell>
      <TableCell className="hidden pr-4 text-muted-foreground xl:table-cell">{f.date(product.updatedAt)}</TableCell>
    </TableRow>
  );
}
