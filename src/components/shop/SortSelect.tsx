"use client";

import { ChevronDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { PRODUCT_SORTS, type ProductSort } from "@/types/catalog";

/**
 * Native select (keyboard and mobile pickers for free), styled like the Figma
 * dropdown. `query` is the current URL query, passed down so this needs no
 * useSearchParams.
 */
export function SortSelect({ value, query }: { value: ProductSort; query: Record<string, string> }) {
  const t = useTranslations("shop.sort");
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const onChange = (sort: string) => {
    const next = new URLSearchParams(query);
    if (sort === "featured") next.delete("sort");
    else next.set("sort", sort);
    // A new order starts again at page 1.
    next.delete("page");
    const search = next.toString();
    startTransition(() => router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false }));
  };

  return (
    <label className="relative inline-flex shrink-0 items-center">
      <span className="sr-only">{t("label")}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-busy={pending}
        className="h-9 w-full min-w-40 cursor-pointer appearance-none rounded-md bg-background py-2 pr-8 pl-3.5 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {PRODUCT_SORTS.map((sort) => (
          <option key={sort} value={sort}>
            {t(sort)}
          </option>
        ))}
      </select>
      <ChevronDownIcon aria-hidden className="pointer-events-none absolute right-3 size-4 text-muted-foreground" />
    </label>
  );
}
