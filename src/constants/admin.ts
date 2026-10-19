import { LayoutDashboardIcon, ShoppingBagIcon, UsersIcon, type LucideIcon } from "lucide-react";

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
} as const;

/** Sidebar entries; `key` is the label in messages (admin.nav). Sections join as they are built. */
export const ADMIN_NAV: { key: "dashboard" | "orders" | "customers"; href: string; icon: LucideIcon }[] = [
  { key: "dashboard", href: ADMIN_LINKS.dashboard, icon: LayoutDashboardIcon },
  { key: "orders", href: ADMIN_LINKS.orders, icon: ShoppingBagIcon },
  { key: "customers", href: ADMIN_LINKS.customers, icon: UsersIcon },
];

/** `?next=` after signing in: only admin paths. */
export function adminNext(next: string | null): string {
  if (!next || !next.startsWith("/admin") || next.startsWith("/admin/login")) return ADMIN_LINKS.dashboard;
  return next;
}
