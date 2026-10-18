import type { CatalogImage } from "./catalog";

/** Shapes returned by `/api/v1/cart`. Money is a "1480.00" string. */

export interface CartLine {
  id: string;
  quantity: number;
  /** Most of this variant the cart may hold (stock or the per-line cap). */
  maxQuantity: number;
  /** False when the product was unpublished, the variant switched off or it sold out. */
  isAvailable: boolean;
  variantId: string;
  sku: string | null;
  unitPrice: string;
  compareAtPrice: string | null;
  lineTotal: string;
  options: { name: string; value: string }[];
  product: { id: string; name: string; slug: string; typeLabel: string | null };
  image: CatalogImage | null;
}

export interface CartRecommendation {
  id: string;
  name: string;
  slug: string;
  typeLabel: string | null;
  image: CatalogImage | null;
  price: { min: string; max: string };
  /** Set for single-variant products, which can be added straight from the cart. */
  variantId: string | null;
}

export interface CartSummary {
  itemCount: number;
  subtotal: string;
  freeShipping: { threshold: string | null; remaining: string | null; qualified: boolean };
  vat: { rate: number; amount: string };
}

export interface Cart {
  items: CartLine[];
  recommendations: CartRecommendation[];
  summary: CartSummary;
}
