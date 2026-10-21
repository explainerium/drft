/** RTK Query cache tags. Add one per entity as its API module lands. */
export const tagTypes = [
  "User",
  "Product",
  "Category",
  "Cart",
  "Order",
  "Address",
  "Wishlist",
  "Dashboard",
  "AdminOrder",
  "Customer",
  "AdminProduct",
  "Attribute",
  "Media",
  "MediaFolder",
  "Shipping",
  "Vat",
  "Setting",
  "Staff",
] as const;

export type TagType = (typeof tagTypes)[number];
