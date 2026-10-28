import type { MetadataRoute } from "next";
import { FEATURES } from "@/constants/features";
import { routing } from "@/i18n/routing";
import { getCategoryTree, getProducts } from "@/lib/catalog";
import { getPageList, getPosts } from "@/lib/content";
import type { CategoryNode } from "@/types/catalog";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3005").replace(/\/$/, "");

/** The URL of a path in a language: German has no prefix, English is under /en. */
const localized = (path: string, locale: string) =>
  `${SITE_URL}${locale === routing.defaultLocale ? "" : `/${locale}`}${path === "/" && locale !== routing.defaultLocale ? "" : path}`;

type Entry = Omit<MetadataRoute.Sitemap[number], "url" | "alternates"> & { path: string };

/** One entry per language, each listing all of them as alternates (hreflang). */
const withLanguages = (entries: Entry[]): MetadataRoute.Sitemap =>
  entries.flatMap(({ path, ...rest }) => {
    const languages = Object.fromEntries(routing.locales.map((locale) => [locale, localized(path, locale)]));
    return routing.locales.map((locale) => ({ ...rest, url: localized(path, locale), alternates: { languages } }));
  });

const flatten = (nodes: CategoryNode[]): CategoryNode[] => nodes.flatMap((node) => [node, ...flatten(node.children)]);

/** Every page of a paged list, 100 at a time. */
async function all<T>(read: (page: number) => Promise<{ data: T[]; meta: { totalPages: number } }>): Promise<T[]> {
  const first = await read(1);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, first.meta.totalPages - 1) }, (_, i) => read(i + 2)),
  );
  return [first, ...rest].flatMap((page) => page.data);
}

/** Public pages only: no account, cart, checkout or admin. Built from the same cached reads as the pages. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tree, products, posts, pages] = await Promise.all([
    getCategoryTree(),
    all((page) => getProducts({ page, limit: 100 })),
    FEATURES.journal ? all((page) => getPosts({ page, limit: 100 })) : Promise.resolve([]),
    getPageList(),
  ]);

  return withLanguages([
    { path: "/", changeFrequency: "daily", priority: 1 },
    { path: "/shop", changeFrequency: "daily", priority: 0.9 },
    // With one category its page repeats /shop.
    ...(tree.length > 1 ? flatten(tree) : []).map((category) => ({
      path: `/shop/${category.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...products.map((product) => ({
      path: `/products/${product.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...(FEATURES.journal ? [{ path: "/journal", changeFrequency: "weekly" as const, priority: 0.6 }] : []),
    ...posts.map((post) => ({
      path: `/journal/${post.slug}`,
      lastModified: post.publishedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...(FEATURES.faq ? [{ path: "/faq", changeFrequency: "monthly" as const, priority: 0.4 }] : []),
    { path: "/contact", changeFrequency: "yearly", priority: 0.3 },
    ...pages.map((page) => ({
      path: `/${page.slug}`,
      lastModified: page.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    })),
  ]);
}
