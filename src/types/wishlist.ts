import type { ProductCard } from "./catalog";

/** A saved product (`/api/v1/wishlist`). */
export interface WishlistItem {
  id: string;
  createdAt: string;
  product: ProductCard;
  /** The size/colour saved from the cart, while it is still sold. */
  variant: {
    id: string;
    price: string;
    available: boolean;
    options: { name: string; value: string }[];
  } | null;
}
