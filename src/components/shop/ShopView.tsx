import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Fragment } from "react";
import { Container } from "@/components/shared/Container";
import { Link } from "@/i18n/navigation";
import { findCategory, getCategoryTree, getProducts } from "@/lib/catalog";
import { PRODUCT_SORTS, type ProductSort } from "@/types/catalog";
import { EditorialBanner } from "./EditorialBanner";
import { Pagination } from "./Pagination";
import { ProductCard } from "./ProductCard";
import { ShopFilterBar, type FilterChip } from "./ShopFilterBar";

export const PAGE_SIZE = 12;
// In the design the editorial banner sits between the first two rows of three.
const BANNER_AFTER = 6;

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)?.trim() || undefined;

/** Reads `q`, `sort` and `page` from the URL; anything invalid falls back to the default. */
export function parseShopQuery(searchParams: SearchParams) {
  const q = first(searchParams.q)?.slice(0, 100);
  const sortParam = first(searchParams.sort);
  const sort: ProductSort = PRODUCT_SORTS.includes(sortParam as ProductSort) ? (sortParam as ProductSort) : "featured";
  const page = Math.max(1, Math.floor(Number(first(searchParams.page)) || 1));
  return { q, sort, page };
}

/** The listing for `/shop` and `/shop/<category>`. Rendered inside Suspense: it reads the URL. */
export async function ShopView({ categorySlug, searchParams }: { categorySlug?: string; searchParams: SearchParams }) {
  const [t, tree] = await Promise.all([getTranslations("shop"), getCategoryTree()]);

  const found = categorySlug ? findCategory(tree, categorySlug) : null;
  if (categorySlug && !found) notFound();
  const category = found?.category;

  const { q, sort, page } = parseShopQuery(searchParams);
  const [result, all] = await Promise.all([
    getProducts({ category: categorySlug, search: q, sort, page, limit: PAGE_SIZE }),
    getProducts({ limit: 1 }),
  ]);
  const { data: products, meta } = result;

  // The query every link keeps (filters change, the page resets).
  const query: Record<string, string> = {};
  if (q) query.q = q;
  if (sort !== "featured") query.sort = sort;
  const withQuery = (path: string) => {
    const search = new URLSearchParams(query).toString();
    return search ? `${path}?${search}` : path;
  };

  const activeRoot = found ? (found.ancestors[0] ?? found.category).slug : undefined;
  const chips: FilterChip[] = [
    { key: "all", label: t("filters.all"), href: withQuery("/shop"), count: all.meta.total, active: !categorySlug },
    ...tree
      .filter((c) => c.productCount > 0)
      .map((c) => ({
        key: c.slug,
        label: c.name,
        href: withQuery(`/shop/${c.slug}`),
        count: c.productCount,
        active: c.slug === activeRoot,
      })),
  ];

  const resultText = q
    ? t("results.search", { count: meta.total, q })
    : t("results.count", { count: meta.total });

  const showBanner = !categorySlug && !q && page === 1 && products.length > BANNER_AFTER;
  const pathname = categorySlug ? `/shop/${categorySlug}` : "/shop";

  return (
    <>
      <section className="bg-surface pt-10 pb-6 lg:pt-12">
        <Container>
          <nav aria-label={t("breadcrumb.label")}>
            <ol className="flex flex-wrap items-center gap-1 text-xs font-medium tracking-[0.02em] text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground">
                  {t("breadcrumb.home")}
                </Link>
              </li>
              <li aria-hidden className="text-subtle-foreground">
                /
              </li>
              {category ? (
                <li>
                  <Link href="/shop" className="hover:text-foreground">
                    {t("breadcrumb.shop")}
                  </Link>
                </li>
              ) : (
                <li aria-current="page" className="text-foreground">
                  {t("title")}
                </li>
              )}
              {found && (
                <>
                  {found.ancestors.map((a) => (
                    <Fragment key={a.id}>
                      <li aria-hidden className="text-subtle-foreground">
                        /
                      </li>
                      <li>
                        <Link href={`/shop/${a.slug}`} className="hover:text-foreground">
                          {a.name}
                        </Link>
                      </li>
                    </Fragment>
                  ))}
                  <li aria-hidden className="text-subtle-foreground">
                    /
                  </li>
                  <li aria-current="page" className="text-foreground">
                    {found.category.name}
                  </li>
                </>
              )}
            </ol>
          </nav>

          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="text-xs font-medium tracking-[0.1em] text-muted-foreground uppercase">
                {found?.ancestors.at(-1)?.name ?? t("eyebrow")}
              </p>
              <h1 className="mt-1 font-heading text-3xl leading-tight font-medium tracking-[-0.025em] md:text-4xl md:leading-[44px]">
                {category?.name ?? t("title")}
              </h1>
              <p className="mt-2 text-[15px] leading-6 text-muted-foreground">
                {category?.description ?? (category ? t("categoryDescription", { name: category.name }) : t("description"))}
              </p>
            </div>
            <p className="inline-flex items-center gap-4 self-start rounded-md bg-secondary px-4 py-2 text-sm font-medium lg:self-auto">
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-brand" aria-hidden />
                {t("proof.tested")}
              </span>
              <span className="text-xs text-subtle-foreground" aria-hidden>
                ·
              </span>
              <span className="text-muted-foreground">{t("proof.handFinished")}</span>
            </p>
          </div>
        </Container>
      </section>

      <ShopFilterBar chips={chips} resultText={resultText} sort={sort} query={query} />

      <section aria-label={t("results.label")} className="bg-surface pt-12 pb-16 lg:pb-24">
        <Container>
          {products.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-24 text-center">
              <h2 className="font-heading text-2xl font-medium">{t("empty.title")}</h2>
              <p className="text-muted-foreground">{q ? t("empty.search", { q }) : t("empty.category")}</p>
              <Link href="/shop" className="mt-2 text-sm font-medium text-brand underline-offset-4 hover:underline">
                {t("empty.reset")}
              </Link>
            </div>
          ) : (
            <>
              <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
                {products.map((product, i) => (
                  <Fragment key={product.id}>
                    {showBanner && i === BANNER_AFTER && (
                      <li className="sm:col-span-2 lg:col-span-3">
                        <EditorialBanner />
                      </li>
                    )}
                    <li className="flex">
                      <ProductCard product={product} priority={i < 3} headingLevel="h2" />
                    </li>
                  </Fragment>
                ))}
              </ul>
              <Pagination page={meta.page} totalPages={meta.totalPages} pathname={pathname} query={query} />
            </>
          )}
        </Container>
      </section>
    </>
  );
}

/** Same footprint as the real header + grid, so nothing jumps when results stream in. */
export function ShopViewSkeleton() {
  return (
    <div aria-hidden className="bg-surface pb-16">
      <Container className="animate-pulse pt-12">
        <div className="h-3 w-32 rounded bg-accent" />
        <div className="mt-5 h-10 w-80 max-w-full rounded bg-accent" />
        <div className="mt-4 h-4 w-[30rem] max-w-full rounded bg-accent" />
        <div className="mt-10 h-9 w-full rounded bg-accent/60" />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="rounded-md bg-card p-2">
              <div className="aspect-[341/427] rounded-md bg-accent" />
              <div className="mt-4 h-3 w-24 rounded bg-accent" />
              <div className="mt-3 h-5 w-48 rounded bg-accent" />
              <div className="mt-6 mb-2 h-9 rounded bg-accent/60" />
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
