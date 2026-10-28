/**
 * Storefront navigation. Labels are message keys under `layout.nav` / `layout.footer.links`.
 * About and the legal pages are CMS pages (admin → Pages) with these slugs.
 */
export const MAIN_NAV = [
  { key: "home", href: "/" },
  { key: "about", href: "/ueber-drft" },
  { key: "products", href: "/shop" },
  { key: "contact", href: "/contact" },
] as const;

export const FOOTER_COLUMNS = [
  {
    key: "shop",
    links: [{ key: "products", href: "/shop" }],
  },
  {
    key: "company",
    links: [
      { key: "about", href: "/ueber-drft" },
      { key: "contact", href: "/contact" },
    ],
  },
] as const;

export const LEGAL_LINKS = [
  { key: "terms", href: "/agb" },
  { key: "privacy", href: "/datenschutz" },
  { key: "imprint", href: "/impressum" },
] as const;

export const ACCOUNT_LINKS = {
  account: "/account",
  orders: "/account/orders",
  addresses: "/account/addresses",
  wishlist: "/account/wishlist",
  login: "/login",
  register: "/register",
  cart: "/cart",
} as const;
