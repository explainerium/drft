import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Pages 1 … n around the current one. Returns null for "…" gaps. */
function pageWindow(current: number, total: number): (number | null)[] {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(null);
    out.push(p);
  });
  return out;
}

export function Pagination({
  page,
  totalPages,
  pathname,
  query,
}: {
  page: number;
  totalPages: number;
  pathname: string;
  query: Record<string, string>;
}) {
  const t = useTranslations("shop.pagination");
  if (totalPages <= 1) return null;

  const hrefFor = (p: number) => {
    const next = new URLSearchParams(query);
    if (p === 1) next.delete("page");
    else next.set("page", String(p));
    const search = next.toString();
    return search ? `${pathname}?${search}` : pathname;
  };

  const arrow = "inline-flex size-9 items-center justify-center rounded-md bg-background transition-colors hover:bg-accent";

  return (
    <nav aria-label={t("label")} className="mt-12 flex items-center justify-center gap-1">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={arrow} aria-label={t("previous")}>
          <ChevronLeftIcon className="size-4" />
        </Link>
      ) : (
        <span className={cn(arrow, "opacity-40")} aria-hidden>
          <ChevronLeftIcon className="size-4" />
        </span>
      )}

      {pageWindow(page, totalPages).map((p, i) =>
        p === null ? (
          <span key={`gap-${i}`} className="px-2 text-muted-foreground" aria-hidden>
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            aria-current={p === page ? "page" : undefined}
            aria-label={t("page", { page: p })}
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-md text-sm font-medium transition-colors",
              p === page ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent",
            )}
          >
            {p}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={arrow} aria-label={t("next")}>
          <ChevronRightIcon className="size-4" />
        </Link>
      ) : (
        <span className={cn(arrow, "opacity-40")} aria-hidden>
          <ChevronRightIcon className="size-4" />
        </span>
      )}
    </nav>
  );
}
