import { useTranslations } from "next-intl";
import { Container } from "@/components/shared/Container";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { ProductSort } from "@/types/catalog";
import { SortSelect } from "./SortSelect";

export interface FilterChip {
  key: string;
  label: string;
  href: string;
  count: number;
  active: boolean;
}

/** Category chips, result count and sort. Sticks under the header while the grid scrolls. */
export function ShopFilterBar({
  chips,
  resultText,
  sort,
  query,
}: {
  chips: FilterChip[];
  resultText: string;
  sort: ProductSort;
  query: Record<string, string>;
}) {
  const t = useTranslations("shop");

  return (
    <div className="sticky top-16 z-30 bg-surface/90 shadow-[0_1px_2px_rgb(0_0_0/0.05)] backdrop-blur-md lg:top-19">
      <Container className="flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        {/* One row that scrolls sideways when the categories outgrow it; the fade hints at more. */}
        <nav
          aria-label={t("filters.label")}
          className="-mx-4 scrollbar-none min-w-0 overflow-x-auto px-4 [mask-image:linear-gradient(to_right,black_calc(100%-40px),transparent)] md:-mx-8 md:px-8 lg:mx-0 lg:px-0"
        >
          <ul className="flex w-max gap-1 pr-8">
            {chips.map((chip) => (
              <li key={chip.key}>
                <Link
                  href={chip.href}
                  scroll={false}
                  aria-current={chip.active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-9 items-center rounded-md px-4 text-sm font-medium tracking-[-0.005em] whitespace-nowrap transition-colors",
                    chip.active
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:text-foreground",
                  )}
                >
                  {chip.label} ({chip.count})
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center justify-between gap-6 lg:justify-end">
          <p className="text-sm whitespace-nowrap text-muted-foreground" aria-live="polite">
            {resultText}
          </p>
          <SortSelect value={sort} query={query} />
        </div>
      </Container>
    </div>
  );
}
