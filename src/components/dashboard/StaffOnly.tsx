"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { STAFF_ROLES } from "@/constants/auth";
import { ADMIN_LINKS } from "@/constants/admin";
import { useIsClient } from "@/hooks/useIsClient";
import { useSession } from "@/redux/api/authApi";

export const pageSkeleton = (
  <div aria-hidden className="flex flex-col gap-6">
    <Skeleton className="h-9 w-56" />
    <Skeleton className="h-[420px] w-full" />
  </div>
);

/**
 * Wraps each admin page: renders it in the browser once the session is known
 * to be staff. The proxy already sends visitors without a staff session cookie
 * to sign in; this covers a session that ended since. The API checks every call.
 */
export function StaffOnly({ children }: { children: ReactNode }) {
  return useIsClient() ? <StaffGate>{children}</StaffGate> : pageSkeleton;
}

const isStaff = (role: string | undefined) => !!role && (STAFF_ROLES as readonly string[]).includes(role);

/**
 * Inside StaffOnly: store setup pages render for ADMINs only; STAFF see why
 * (the API refuses them anyway).
 */
export function AdminOnly({ children }: { children: ReactNode }) {
  const t = useTranslations("admin.common");
  const { user } = useSession();
  if (user?.role === "ADMIN") return children;
  return (
    <div className="panel flex flex-col items-start gap-2 p-6">
      <h1 className="font-heading text-xl font-semibold">{t("adminOnlyTitle")}</h1>
      <p className="text-sm text-muted-foreground">{t("adminOnlyBody")}</p>
    </div>
  );
}

function StaffGate({ children }: { children: ReactNode }) {
  const { user, isLoading } = useSession();
  const router = useRouter();
  const allowed = isStaff(user?.role);

  useEffect(() => {
    if (isLoading || allowed) return;
    router.replace(`${ADMIN_LINKS.login}?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
  }, [isLoading, allowed, router]);

  return allowed ? children : pageSkeleton;
}
