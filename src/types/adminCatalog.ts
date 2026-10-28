import type { CatalogImage } from "./catalog";
import type { Translations } from "./i18n";

/** Shapes returned by the staff catalog endpoints (products, categories, attributes, media). */

export type ProductStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface AdminProductRow {
  id: string;
  name: string;
  slug: string;
  status: ProductStatus;
  isFeatured: boolean;
  sortOrder: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  featuredImage: CatalogImage | null;
  categories: { id: string; name: string; slug: string }[];
  price: { min: string | null; max: string | null };
  inStock: boolean;
  variantCount: number;
  /** Tracked stock only. */
  totalStock: number;
}

export interface AdminVariant {
  id: string;
  sku: string | null;
  price: string;
  compareAtPrice: string | null;
  weightKg: string | null;
  isDefault: boolean;
  sortOrder: number;
  manageStock: boolean;
  stock: number;
  allowBackorder: boolean;
  isActive: boolean;
  imageAssetId: string | null;
  attributeValueIds: string[];
}

/** The product page's editorial blocks as stored: the story photo is an asset id. */
export interface ProductContentInput {
  profile?: string;
  highlight?: { title: string; body: string };
  story?: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
    stats: { value: string; label: string }[];
    quote?: { label?: string; text: string; author: string };
    imageAssetId?: string;
  };
  features?: {
    eyebrow: string;
    title: string;
    intro?: string;
    items: { label: string; title: string; body: string; footnote?: string; footnoteValue?: string }[];
  };
  inTheBox?: string[];
}

/** One reported row of a product CSV import (unchanged rows are only counted). */
export interface ProductImportRow {
  line: number;
  sku: string;
  product: string | null;
  result: "update" | "error";
  changes: { field: "price" | "compare_at_price" | "stock" | "active"; from: string; to: string }[];
  error?: string;
}

export interface ProductImportResult {
  applied: boolean;
  summary: { rows: number; updates: number; unchanged: number; errors: number };
  rows: ProductImportRow[];
}

export type ProductText = "name" | "badge" | "typeLabel" | "shortDescription" | "description" | "metaTitle" | "metaDescription";

/** English texts of a product; `content` holds translated editorial blocks (not edited in the admin yet). */
export type ProductTranslations = { en?: Partial<Record<ProductText, string>> & { content?: ProductContentInput } } | null;

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  status: ProductStatus;
  badge: string | null;
  typeLabel: string | null;
  shortDescription: string | null;
  description: string | null;
  isFeatured: boolean;
  sortOrder: number;
  metaTitle: string | null;
  metaDescription: string | null;
  content: ProductContentInput | null;
  translations: ProductTranslations;
  /** The picture behind content.story.imageAssetId, for the editor. */
  storyImage: CatalogImage | null;
  publishedAt: string | null;
  featuredAssetId: string | null;
  images: { assetId: string; alt: string | null; sortOrder: number; asset: CatalogImage }[];
  variants: AdminVariant[];
  specs: { id: string; group: string | null; label: string; value: string; sortOrder: number }[];
  categoryIds: string[];
  related: { id: string; name: string; slug: string; status: ProductStatus }[];
  relatedIds: string[];
  createdAt: string;
  updatedAt: string;
}

/** What the editor sends. Lists replace the stored ones; variants left out are deleted. */
export interface ProductInput {
  name: string;
  slug?: string;
  status: ProductStatus;
  badge: string | null;
  typeLabel: string | null;
  shortDescription: string | null;
  description: string | null;
  isFeatured: boolean;
  sortOrder: number;
  metaTitle: string | null;
  metaDescription: string | null;
  content: ProductContentInput | null;
  translations?: ProductTranslations;
  featuredAssetId: string | null;
  categoryIds: string[];
  images: { assetId: string; alt: string | null; sortOrder: number }[];
  specs: { group: string | null; label: string; value: string; sortOrder: number }[];
  relatedIds: string[];
  variants: {
    id?: string;
    sku: string | null;
    price: string;
    compareAtPrice: string | null;
    weightKg: string | null;
    stock: number;
    manageStock: boolean;
    allowBackorder: boolean;
    isActive: boolean;
    isDefault: boolean;
    imageAssetId: string | null;
    sortOrder: number;
    attributeValueIds: string[];
  }[];
}

export interface ProductListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProductStatus;
  sortBy?: "createdAt" | "updatedAt" | "name" | "sortOrder";
  sortOrder?: "asc" | "desc";
}

export interface AdminCategory {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  imageAssetId: string | null;
  image: CatalogImage | null;
  isHidden: boolean;
  sortOrder: number;
  metaTitle: string | null;
  metaDescription: string | null;
  translations: Translations<CategoryText>;
  /** Products linked to this category itself (not its subcategories). */
  productCount: number;
  childCount: number;
}

export interface CategoryInput {
  name: string;
  slug?: string;
  parentId: string | null;
  description: string | null;
  imageAssetId: string | null;
  sortOrder: number;
  isHidden: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  translations: Translations<CategoryText>;
}

export type CategoryText = "name" | "description" | "metaTitle" | "metaDescription";

export interface AdminAttribute {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
  values: AttributeValue[];
}

export interface AttributeValue {
  id: string;
  code: string;
  label: string;
  hexColor: string | null;
  sortOrder: number;
  /** How many variants use it; a used value cannot be deleted. */
  _count?: { variants: number };
}

export interface AttributeInput {
  name: string;
  code?: string;
  sortOrder: number;
}

export interface AttributeValueInput {
  label: string;
  code?: string;
  hexColor: string | null;
  sortOrder: number;
}

export interface MediaAsset {
  id: string;
  url: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  originalName: string;
  sizeBytes: number;
  folderId: string | null;
  alt: string | null;
  derivatives: Partial<Record<"thumb" | "medium" | "large", { url: string; width: number; height: number }>>;
  createdAt: string;
}

export interface MediaFolder {
  id: string;
  parentId: string | null;
  name: string;
  sortOrder: number;
  assetCount: number;
  childCount: number;
}

export interface MediaListQuery {
  page?: number;
  limit?: number;
  search?: string;
  /** A folder id, or "none" for images in no folder. */
  folderId?: string;
}
