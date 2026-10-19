"use client";

import { ExternalLinkIcon, LogOutIcon, UserRoundIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/shared/layout/Logo";
import { Button } from "@/components/ui/button";
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
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ADMIN_LINKS, ADMIN_NAV } from "@/constants/admin";
import { useIsClient } from "@/hooks/useIsClient";
import { useLogoutMutation, useSession } from "@/redux/api/authApi";

/** The admin frame: collapsible sidebar (a sheet on phones) and a top bar with the staff menu. */
export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="h-14 justify-center border-b border-sidebar-border px-3">
          <Link href={ADMIN_LINKS.dashboard} className="flex items-center gap-2 overflow-hidden">
            <Logo id="admin-logo" className="h-7 shrink-0" />
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              {/* The active entry needs the pathname, which dynamic routes only know at request time. */}
              <Suspense fallback={<AdminNavView />}>
                <AdminNav />
              </Suspense>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="min-w-0 bg-surface">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur-xs">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1" />
          <StaffMenu />
        </header>
        <div className="mx-auto flex w-full max-w-[1400px] min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function AdminNav() {
  return <AdminNavView pathname={usePathname()} />;
}

/** Without a pathname nothing is marked active (the prerendered fallback). */
function AdminNavView({ pathname }: { pathname?: string }) {
  const t = useTranslations("admin.nav");
  const isActive = (href: string) =>
    !!pathname &&
    (href === ADMIN_LINKS.dashboard ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <SidebarMenu>
      {ADMIN_NAV.map(({ key, href, icon: Icon }) => (
        <SidebarMenuItem key={key}>
          <SidebarMenuButton asChild isActive={isActive(href)} tooltip={t(key)}>
            <Link href={href}>
              <Icon />
              <span>{t(key)}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

function StaffMenu() {
  return useIsClient() ? <LiveStaffMenu /> : <StaffMenuView name={null} />;
}

function LiveStaffMenu() {
  const { user } = useSession();
  return <StaffMenuView name={user ? `${user.firstName} ${user.lastName}`.trim() || user.email : null} />;
}

function StaffMenuView({ name }: { name: string | null }) {
  const t = useTranslations("admin.nav");
  const router = useRouter();
  const [logout] = useLogoutMutation();

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
        <Button variant="ghost" size="sm" className="gap-2" aria-label={t("menu")}>
          <span className="flex size-7 items-center justify-center rounded-full bg-secondary">
            <UserRoundIcon className="size-4" />
          </span>
          {name && <span className="hidden max-w-40 truncate sm:inline">{name}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {name && (
          <>
            <DropdownMenuLabel className="truncate">{name}</DropdownMenuLabel>
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
