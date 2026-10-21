import type { MetadataRoute } from "next";
import { getCategoryTree, getProducts } from "@/lib/catalog";
import { getPageList, getPosts } from "@/lib/content";
import type { CategoryNode } from "@/types/catalog";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3005").replace(/\/$/, "");

const url = (path: string) => `${SITE_URL}${path}`;

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
    all((page) => getPosts({ page, limit: 100 })),
    getPageList(),
  ]);

  return [
    { url: url("/"), changeFrequency: "daily", priority: 1 },
    { url: url("/shop"), changeFrequency: "daily", priority: 0.9 },
    ...flatten(tree).map((category) => ({
      url: url(`/shop/${category.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...products.map((product) => ({
      url: url(`/products/${product.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    { url: url("/journal"), changeFrequency: "weekly", priority: 0.6 },
    ...posts.map((post) => ({
      url: url(`/journal/${post.slug}`),
      lastModified: post.publishedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    { url: url("/faq"), changeFrequency: "monthly", priority: 0.4 },
    { url: url("/contact"), changeFrequency: "yearly", priority: 0.3 },
    ...pages.map((page) => ({
      url: url(`/${page.slug}`),
      lastModified: page.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    })),
  ];
}
