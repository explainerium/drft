"use client";

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
