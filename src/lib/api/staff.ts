import "server-only";
import type { NextRequest } from "next/server";
import { STAFF_ROLES } from "@/constants/auth";

const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:5005";

/** For Route Handlers: asks the backend who the caller is, with their own cookies, and whether that is staff. */
export async function isStaffRequest(req: NextRequest): Promise<boolean> {
  const res = await fetch(new URL("/api/v1/auth/me", API_ORIGIN), {
    headers: { cookie: req.headers.get("cookie") ?? "", accept: "application/json" },
    cache: "no-store",
  }).catch(() => null);
  if (!res?.ok) return false;
  const body = (await res.json().catch(() => null)) as { data?: { role?: string } } | null;
  return !!body?.data?.role && (STAFF_ROLES as readonly string[]).includes(body.data.role);
}
