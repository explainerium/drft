/** Shapes returned by the public catalog API (`/api/v1/products`, `/api/v1/categories`). */

export interface ImageSize {
  url: string;
  width: number;
  height: number;
}

export interface CatalogImage {
  id: string;
  url: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  alt: string | null;
  sizes: Partial<Record<"thumb" | "medium" | "large", ImageSize>>;
}

export interface CategoryRef {
  id: string;
  name: string;
  slug: string;
}

export interface CategoryNode extends CategoryRef {
  parentId: string | null;
  description: string | null;
  sortOrder: number;
  metaTitle: string | null;
  metaDescription: string | null;
  image: CatalogImage | null;
  productCount: number;
  children: CategoryNode[];
}

/** Money comes as a string with 2 decimals ("1480.00"); never do float math on it. */
export interface ProductCard {
  id: string;
  name: string;
  slug: string;
  badge: string | null;
  typeLabel: string | null;
  shortDescription: string | null;
  isFeatured: boolean;
  featuredImage: CatalogImage | null;
  price: { min: string | null; max: string | null };
  compareAtPrice: string | null;
  inStock: boolean;
  categories: CategoryRef[];
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const PRODUCT_SORTS = ["featured", "newest", "price_asc", "price_desc", "name"] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];
