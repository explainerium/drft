"use client";

import { FileTextIcon, ImageIcon, NewspaperIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ADMIN_LINKS } from "@/constants/admin";
import { cn } from "@/lib/utils";
import { useGetAdminPagesQuery, useGetAdminPostsQuery, type ContentStatus } from "@/redux/api/adminContentApi";
import { PageHeader, Pagination, QueryError, useAdminFormat } from "../AdminPage";
import { SearchBox } from "../SearchBox";

export function ContentStatusBadge({ status }: { status: ContentStatus }) {
  const t = useTranslations("admin.contentEditor.status");
  return (
    <span
      className={cn(
        "rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap",
        status === "PUBLISHED" ? "bg-success/10 text-emerald-700" : "bg-muted text-muted-foreground",
      )}
    >
      {t(status)}
    </span>
  );
}

const STATUSES: ContentStatus[] = ["PUBLISHED", "DRAFT"];

/** Journal posts, last edited first. Filters live in the URL (?status=&q=&page=). */
export function JournalView() {
  const t = useTranslations("admin.journal");
  const f = useAdminFormat();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const statusParam = searchParams.get("status");
  const status = STATUSES.find((s) => s === statusParam);
  const search = searchParams.get("q") ?? "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const { data, isLoading, isError, refetch } = useGetAdminPostsQuery({ page, search, status });

  const setParams = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Button asChild>
            <Link href={ADMIN_LINKS.newPost}>
              <PlusIcon />
              {t("new")}
            </Link>
          </Button>
        }
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="group" aria-label={t("filter")} className="flex gap-1.5">
          {[undefined, ...STATUSES].map((value) => (
            <button
              key={value ?? "all"}
              type="button"
              aria-pressed={status === value}
              onClick={() => setParams({ status: value, page: undefined })}
              className={cn(
                "inline-flex h-8 items-center rounded-full border px-3 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                status === value ? "border-abyss bg-abyss text-white" : "border-border bg-card hover:bg-accent",
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
        <div className="panel overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">{t("columns.post")}</TableHead>
                <TableHead>{t("columns.status")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("columns.published")}</TableHead>
                <TableHead className="hidden pr-5 lg:table-cell">{t("columns.updated")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading || !data ? (
                <TableRow>
                  <TableCell colSpan={4} className="px-5">
                    <Skeleton className="h-32 w-full" />
                  </TableCell>
                </TableRow>
              ) : data.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    <NewspaperIcon className="mx-auto mb-2 size-5" aria-hidden />
                    {t("empty")}
                  </TableCell>
                </TableRow>
              ) : (
                data.data.map((post) => (
                  <TableRow key={post.id} className="cursor-pointer" onClick={() => router.push(ADMIN_LINKS.post(post.id))}>
                    <TableCell className="max-w-96 pl-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                          {post.cover ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={post.cover.sizes.thumb?.url ?? post.cover.url} alt="" className="size-full object-cover" />
                          ) : (
                            <ImageIcon className="size-4 text-muted-foreground" aria-hidden />
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={ADMIN_LINKS.post(post.id)}
                            onClick={(event) => event.stopPropagation()}
                            className="block truncate font-medium hover:underline"
                          >
                            {post.title}
                          </Link>
                          {post.tag && <div className="truncate text-xs text-muted-foreground">{post.tag}</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <ContentStatusBadge status={post.status} />
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {post.publishedAt ? f.date(post.publishedAt) : "—"}
                    </TableCell>
                    <TableCell className="hidden pr-5 text-muted-foreground lg:table-cell">{f.dateTime(post.updatedAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
      {data && <Pagination meta={data.meta} onPage={(next) => setParams({ page: next > 1 ? String(next) : undefined })} />}
    </>
  );
}

/** Site pages at the root of the store (/about, /privacy, ...). */
export function PagesView() {
  const t = useTranslations("admin.pages");
  const f = useAdminFormat();
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useGetAdminPagesQuery();

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Button asChild>
            <Link href={ADMIN_LINKS.newPage}>
              <PlusIcon />
              {t("new")}
            </Link>
          </Button>
        }
      />
      {isError ? (
        <QueryError onRetry={refetch} />
      ) : (
        <div className="panel overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">{t("columns.page")}</TableHead>
                <TableHead className="hidden sm:table-cell">{t("columns.address")}</TableHead>
                <TableHead>{t("columns.status")}</TableHead>
                <TableHead className="hidden pr-5 md:table-cell">{t("columns.updated")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading || !data ? (
                <TableRow>
                  <TableCell colSpan={4} className="px-5">
                    <Skeleton className="h-32 w-full" />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    <FileTextIcon className="mx-auto mb-2 size-5" aria-hidden />
                    {t("empty")}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((page) => (
                  <TableRow key={page.id} className="cursor-pointer" onClick={() => router.push(ADMIN_LINKS.page(page.id))}>
                    <TableCell className="pl-5">
                      <Link
                        href={ADMIN_LINKS.page(page.id)}
                        onClick={(event) => event.stopPropagation()}
                        className="font-medium hover:underline"
                      >
                        {page.title}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">/{page.slug}</TableCell>
                    <TableCell>
                      <ContentStatusBadge status={page.status} />
                    </TableCell>
                    <TableCell className="hidden pr-5 text-muted-foreground md:table-cell">{f.dateTime(page.updatedAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
      <p className="text-xs text-muted-foreground">{t("hint")}</p>
    </>
  );
}
