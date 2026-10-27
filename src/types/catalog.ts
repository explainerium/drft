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
  /** Colour values across the variants, for the dots on a card. */
  swatches: { label: string; hexColor: string }[];
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

export interface VariantAttribute {
  attributeId: string;
  attributeCode: string;
  attributeName: string;
  valueId: string;
  code: string;
  label: string;
  hexColor: string | null;
}

export interface ProductVariant {
  id: string;
  sku: string | null;
  price: string;
  compareAtPrice: string | null;
  isDefault: boolean;
  sortOrder: number;
  image: CatalogImage | null;
  attributes: VariantAttribute[];
  inStock: boolean;
  /** Tracked stock at or below the shop's low-stock level (the count itself is never sent). */
  lowStock: boolean;
  allowBackorder: boolean;
}

/** An attribute the variants differ by, with only the values in use (the PDP picker). */
export interface ProductOption {
  id: string;
  code: string;
  name: string;
  values: { id: string; code: string; label: string; hexColor: string | null }[];
}

export interface ProductSpec {
  id: string;
  group: string | null;
  label: string;
  value: string;
}

/** Editorial blocks; every one is optional. */
export interface ProductContent {
  profile?: string;
  highlight?: { title: string; body: string };
  story?: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
    stats: { value: string; label: string }[];
    quote?: { label?: string; text: string; author: string };
    image: CatalogImage | null;
  };
  features?: {
    eyebrow: string;
    title: string;
    intro?: string;
    items: { label: string; title: string; body: string; footnote?: string; footnoteValue?: string }[];
  };
  inTheBox?: string[];
}

export interface ProductDetail extends Omit<ProductCard, "isFeatured"> {
  description: string | null;
  content: ProductContent;
  metaTitle: string | null;
  metaDescription: string | null;
  images: (CatalogImage & { sortOrder: number })[];
  options: ProductOption[];
  variants: ProductVariant[];
  specs: ProductSpec[];
  related: ProductCard[];
}
