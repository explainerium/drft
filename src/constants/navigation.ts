/**
 * Storefront navigation. Labels are message keys under `layout.nav` / `layout.footer.links`.
 * Category links use the backend category slugs (`/shop/<slug>`).
 */
export const MAIN_NAV = [
  { key: "kites", href: "/shop/kites" },
  { key: "boards", href: "/shop/boards" },
  { key: "foilWings", href: "/shop/foils-wings" },
  { key: "stories", href: "/journal" },
  { key: "about", href: "/about" },
] as const;

export const FOOTER_COLUMNS = [
  {
    key: "shop",
    links: [
      { key: "kites", href: "/shop/kites" },
      { key: "foilBoards", href: "/shop/foil-boards" },
      { key: "controlBars", href: "/shop/control-bars" },
      { key: "wings", href: "/shop/foils-wings" },
      { key: "harnesses", href: "/shop/harnesses" },
      { key: "accessories", href: "/shop/accessories" },
    ],
  },
  {
    key: "about",
    links: [
      { key: "ourStory", href: "/about" },
      { key: "sustainability", href: "/sustainability" },
      { key: "journal", href: "/journal" },
      { key: "teamRiders", href: "/team-riders" },
      { key: "retailers", href: "/retailers" },
    ],
  },
  {
    key: "support",
    links: [
      { key: "shippingReturns", href: "/shipping-returns" },
      { key: "kiteCare", href: "/kite-care" },
      { key: "warranty", href: "/warranty" },
      { key: "faq", href: "/faq" },
      { key: "contact", href: "/contact" },
    ],
  },
] as const;

export const LEGAL_LINKS = [
  { key: "privacy", href: "/privacy" },
  { key: "terms", href: "/terms" },
  { key: "cookies", href: "/cookies" },
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
