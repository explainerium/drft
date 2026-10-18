import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { CategoryNode, PageMeta, ProductCard, ProductDetail, ProductSort } from "@/types/catalog";
import { ApiRequestError, apiGet } from "./api/server";

/**
 * Cached catalog reads for Server Components. Tags let an admin save
 * revalidate them later (`revalidateTag("products")` from /api/internal).
 */

export async function getCategoryTree(): Promise<CategoryNode[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("categories");
  return (await apiGet<CategoryNode[]>("/categories")).data;
}

/** Depth-first lookup in the tree, with the trail of ancestors that leads to it. */
export function findCategory(
  tree: CategoryNode[],
  slug: string,
  trail: CategoryNode[] = [],
): { category: CategoryNode; ancestors: CategoryNode[] } | null {
  for (const node of tree) {
    if (node.slug === slug) return { category: node, ancestors: trail };
    const found = findCategory(node.children, slug, [...trail, node]);
    if (found) return found;
  }
  return null;
}

export interface ProductQuery {
  category?: string;
  search?: string;
  sort?: ProductSort;
  page?: number;
  limit?: number;
}

export async function getProducts(query: ProductQuery): Promise<{ data: ProductCard[]; meta: PageMeta }> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");
  return apiGet<ProductCard[], PageMeta>("/products", { ...query });
}

/** One published product, or null when the slug is unknown (or not published). */
export async function getProduct(slug: string): Promise<ProductDetail | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products", `product:${slug}`);
  try {
    return (await apiGet<ProductDetail>(`/products/${encodeURIComponent(slug)}`)).data;
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 404) return null;
    throw err;
  }
}
