import {
  CircleHelpIcon,
  FolderTreeIcon,
  InboxIcon,
  MailIcon,
  NewspaperIcon,
  ImagesIcon,
  LayoutDashboardIcon,
  PackageIcon,
  PercentIcon,
  SettingsIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  SlidersHorizontalIcon,
  TruckIcon,
  TypeIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import { FEATURES } from "./features";

/** The admin is English only; dates are shown in the shop's home time zone. */
export const ADMIN_LOCALE = "en";
export const ADMIN_TIME_ZONE = "Europe/Amsterdam";

export const ADMIN_LINKS = {
  login: "/admin/login",
  dashboard: "/admin",
  orders: "/admin/orders",
  order: (id: string) => `/admin/orders/${id}`,
  customers: "/admin/customers",
  customer: (id: string) => `/admin/customers/${id}`,
  products: "/admin/products",
  newProduct: "/admin/products/new",
  product: (id: string) => `/admin/products/${id}`,
  categories: "/admin/categories",
  attributes: "/admin/attributes",
  media: "/admin/media",
  shipping: "/admin/shipping",
  vat: "/admin/vat",
  staff: "/admin/staff",
  settings: "/admin/settings",
  journal: "/admin/journal",
  newPost: "/admin/journal/new",
  post: (id: string) => `/admin/journal/${id}`,
  pages: "/admin/pages",
  newPage: "/admin/pages/new",
  page: (id: string) => `/admin/pages/${id}`,
  siteTexts: "/admin/texts",
  sitePages: "/admin/texts?section=pages",
  siteText: (key: string) => `/admin/texts?key=${encodeURIComponent(key)}`,
  faq: "/admin/faq",
  newsletter: "/admin/newsletter",
  messages: "/admin/messages",
} as const;

type NavKey =
  | "dashboard"
  | "orders"
  | "customers"
  | "products"
  | "categories"
  | "attributes"
  | "media"
  | "journal"
  | "pages"
  | "siteTexts"
  | "faq"
  | "newsletter"
  | "messages"
  | "shipping"
  | "vat"
  | "staff"
  | "settings";

/** Sidebar groups; `key` is the label in messages (admin.nav). Sections join as they are built. */
/** `adminOnly` groups are hidden from STAFF (the API refuses them too). */
export const ADMIN_NAV: {
  group: "store" | "catalog" | "content" | "setup";
  adminOnly?: boolean;
  /** `also`: other paths that belong to the item (it stays marked there). */
  items: { key: NavKey; href: string; icon: LucideIcon; also?: readonly string[] }[];
}[] = [
  {
    group: "store",
    items: [
      { key: "dashboard", href: ADMIN_LINKS.dashboard, icon: LayoutDashboardIcon },
      { key: "orders", href: ADMIN_LINKS.orders, icon: ShoppingBagIcon },
      { key: "customers", href: ADMIN_LINKS.customers, icon: UsersIcon },
    ],
  },
  {
    group: "catalog",
    items: [
      { key: "products", href: ADMIN_LINKS.products, icon: PackageIcon },
      { key: "categories", href: ADMIN_LINKS.categories, icon: FolderTreeIcon },
      { key: "attributes", href: ADMIN_LINKS.attributes, icon: SlidersHorizontalIcon },
      { key: "media", href: ADMIN_LINKS.media, icon: ImagesIcon },
    ],
  },
  {
    group: "content",
    items: [
      { key: "siteTexts", href: ADMIN_LINKS.siteTexts, icon: TypeIcon, also: [ADMIN_LINKS.pages] },
      ...(FEATURES.journal ? [{ key: "journal" as const, href: ADMIN_LINKS.journal, icon: NewspaperIcon }] : []),
      ...(FEATURES.faq ? [{ key: "faq" as const, href: ADMIN_LINKS.faq, icon: CircleHelpIcon }] : []),
      { key: "newsletter", href: ADMIN_LINKS.newsletter, icon: MailIcon },
      { key: "messages", href: ADMIN_LINKS.messages, icon: InboxIcon },
    ],
  },
  {
    group: "setup",
    adminOnly: true,
    items: [
      { key: "shipping", href: ADMIN_LINKS.shipping, icon: TruckIcon },
      { key: "vat", href: ADMIN_LINKS.vat, icon: PercentIcon },
      { key: "staff", href: ADMIN_LINKS.staff, icon: ShieldCheckIcon },
      { key: "settings", href: ADMIN_LINKS.settings, icon: SettingsIcon },
    ],
  },
];

/** `?next=` after signing in: only admin paths. */
export function adminNext(next: string | null): string {
  if (!next || !next.startsWith("/admin") || next.startsWith("/admin/login")) return ADMIN_LINKS.dashboard;
  return next;
}
