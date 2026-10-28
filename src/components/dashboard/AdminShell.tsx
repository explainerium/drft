"use client";

import { ChevronsUpDownIcon, ExternalLinkIcon, LogOutIcon, SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useState, type ComponentType, type ReactNode } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/shared/layout/Logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { ADMIN_LINKS, ADMIN_NAV } from "@/constants/admin";
import { useIsClient } from "@/hooks/useIsClient";
import { cn } from "@/lib/utils";
import { useGetOrderCountsQuery } from "@/redux/api/adminApi";
import { useLogoutMutation, useSession } from "@/redux/api/authApi";
import type { User } from "@/types/auth";
import type { OrderStatus } from "@/types/checkout";

/**
 * The admin frame: a light sidebar (a sheet on phones) with search, the
 * sections and the staff card. On phones a slim top bar holds
 * the menu button.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r-sidebar-border">
        <SidebarHeader className="gap-3 px-3 pt-4 pb-2">
          <div className="flex h-9 items-center justify-between gap-2 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <Link
              href={ADMIN_LINKS.dashboard}
              className="flex items-center overflow-hidden rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:hidden"
            >
              <Logo className="h-5 shrink-0" />
            </Link>
            <SidebarTrigger className="text-muted-foreground" />
          </div>
          <SidebarSearch />
        </SidebarHeader>
        <SidebarContent className="gap-1 px-1">
          {/* The active entry needs the pathname, which dynamic routes only know at request time. */}
          <Suspense fallback={<AdminNavView />}>
            <AdminNav />
          </Suspense>
        </SidebarContent>
        <SidebarFooter className="p-3 group-data-[collapsible=icon]:p-2">
          <StaffCard />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="min-w-0 bg-surface">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur-sm md:hidden">
          <SidebarTrigger className="-ml-1.5" />
          <Logo className="h-4" />
        </header>
        <div className="flex w-full min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6 lg:px-8 lg:py-7">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

/** Finds orders by number, email or name from anywhere in the admin. */
function SidebarSearch() {
  const t = useTranslations("admin.nav");
  const router = useRouter();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const [value, setValue] = useState("");
  if (state === "collapsed" && !isMobile) return null;

  return (
    <div role="search" className="relative">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle-foreground" />
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter" || !value.trim()) return;
          event.preventDefault();
          router.push(`${ADMIN_LINKS.orders}?q=${encodeURIComponent(value.trim())}`);
          setValue("");
          setOpenMobile(false);
        }}
        placeholder={t("search")}
        aria-label={t("search")}
        className="h-9 w-full rounded-lg border border-sidebar-border bg-white pr-3 pl-9 text-sm outline-none placeholder:text-subtle-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 [&::-webkit-search-cancel-button]:hidden"
      />
    </div>
  );
}

function AdminNav() {
  return <AdminNavView pathname={usePathname()} />;
}

/** Icon in a small framed tile; the active entry is filled with the brand blue. */
const itemClass =
  "h-10 gap-3 rounded-xl px-2 text-[13.5px] font-medium text-sidebar-foreground hover:bg-sidebar-accent data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground data-[active=true]:shadow-[0_6px_16px_-8px_rgb(0_99_152/0.7)] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0.5";

function ItemIcon({ icon: Icon }: { icon: ComponentType<{ className?: string }> }) {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-sidebar-border bg-white text-sidebar-foreground transition-colors group-data-[active=true]/menu-button:border-white/15 group-data-[active=true]/menu-button:bg-white/15 group-data-[active=true]/menu-button:text-white">
      <Icon className="size-4" />
    </span>
  );
}

/** Without a pathname nothing is marked active (the prerendered fallback). */
function AdminNavView({ pathname }: { pathname?: string }) {
  const t = useTranslations("admin.nav");
  const isActive = (href: string) =>
    !!pathname &&
    (href === ADMIN_LINKS.dashboard ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));

  return ADMIN_NAV.map(({ group, items, adminOnly }) => {
    const section = (
      <SidebarGroup key={group} className="py-1.5">
        <SidebarGroupLabel className="text-xs text-subtle-foreground">{t(`groups.${group}`)}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu className="gap-1">
            {items.map(({ key, href, icon }) => {
              const active = isActive(href);
              return (
                <SidebarMenuItem key={key}>
                  <SidebarMenuButton asChild isActive={active} tooltip={t(key)} className={itemClass}>
                    <Link href={href}>
                      <ItemIcon icon={icon} />
                      <span className="flex-1 truncate group-data-[collapsible=icon]:hidden">{t(key)}</span>
                      {key === "orders" && <ToShipBadge active={active} />}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
    return adminOnly ? <AdminOnlyNav key={group}>{section}</AdminOnlyNav> : section;
  });
}

/** Shows admin-only sections once the session is known to be an ADMIN. */
function AdminOnlyNav({ children }: { children: ReactNode }) {
  return useIsClient() ? <LiveAdminOnlyNav>{children}</LiveAdminOnlyNav> : null;
}

function LiveAdminOnlyNav({ children }: { children: ReactNode }) {
  const { user } = useSession();
  return user?.role === "ADMIN" ? children : null;
}

const TO_SHIP: OrderStatus[] = ["PAID", "PROCESSING", "PARTIALLY_REFUNDED"];

/** Orders waiting to ship, for the sidebar badge; refreshed every minute. Browser only. */
function useOrderCounts() {
  const { data } = useGetOrderCountsQuery(undefined, { pollingInterval: 60_000 });
  return { toShip: data ? TO_SHIP.reduce((sum, status) => sum + data[status], 0) : 0 };
}

function ToShipBadge({ active }: { active: boolean }) {
  return useIsClient() ? <LiveToShipBadge active={active} /> : null;
}

function LiveToShipBadge({ active }: { active: boolean }) {
  const t = useTranslations("admin.nav");
  const { toShip } = useOrderCounts();
  if (!toShip) return null;
  return (
    <span
      aria-label={t("toShip", { count: toShip })}
      className={cn(
        "flex h-5 min-w-5 items-center justify-center rounded-md px-1.5 text-[11px] font-semibold tabular-nums group-data-[collapsible=icon]:hidden",
        active ? "bg-white/20 text-white" : "bg-brand-soft text-brand",
      )}
    >
      {toShip}
    </span>
  );
}

function StaffCard() {
  return useIsClient() ? <LiveStaffCard /> : <StaffCardView user={null} />;
}

function LiveStaffCard() {
  const { user } = useSession();
  return <StaffCardView user={user} />;
}

const initialsOf = (user: User) =>
  ((user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "")).toUpperCase() || user.email[0]!.toUpperCase();

function StaffCardView({ user }: { user: User | null }) {
  const t = useTranslations("admin.nav");
  const router = useRouter();
  const [logout] = useLogoutMutation();
  const name = user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email : "";

  const signOut = async () => {
    await logout()
      .unwrap()
      .catch(() => undefined);
    toast.success(t("signedOut"));
    router.replace(ADMIN_LINKS.login);
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("menu")}
          className="flex w-full items-center gap-3 rounded-xl border border-sidebar-border bg-white p-2 text-left shadow-xs transition-colors outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:shadow-none"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary font-heading text-xs font-semibold text-primary-foreground">
            {user ? initialsOf(user) : ""}
          </span>
          <span className="flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-medium">{name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {user ? t(`roles.${user.role === "ADMIN" ? "ADMIN" : "STAFF"}`) : ""}
            </span>
          </span>
          <ChevronsUpDownIcon className="size-4 shrink-0 text-subtle-foreground group-data-[collapsible=icon]:hidden" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56">
        {user && (
          <>
            <DropdownMenuLabel className="flex flex-col">
              <span className="truncate">{name}</span>
              <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem asChild>
          <a href="/" target="_blank" rel="noopener">
            <ExternalLinkIcon />
            {t("storefront")}
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={signOut}>
          <LogOutIcon />
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
