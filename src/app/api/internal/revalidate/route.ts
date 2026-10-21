import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { STAFF_ROLES } from "@/constants/auth";

const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:5005";

/** The cache tags the catalog and content reads use (src/lib/catalog.ts, src/lib/content.ts). */
const TAG = /^(?:products|categories|posts|pages|faq|settings|(?:product|post|page):[a-z0-9-]{1,160})$/;

/** Asks the backend who the caller is, with their own cookies; only staff may revalidate. */
async function isStaff(req: NextRequest): Promise<boolean> {
  const res = await fetch(new URL("/api/v1/auth/me", API_ORIGIN), {
    headers: { cookie: req.headers.get("cookie") ?? "", accept: "application/json" },
    cache: "no-store",
  }).catch(() => null);
  if (!res?.ok) return false;
  const body = (await res.json().catch(() => null)) as { data?: { role?: string } } | null;
  return !!body?.data?.role && (STAFF_ROLES as readonly string[]).includes(body.data.role);
}

/**
 * Called by the admin after a catalog save so the storefront shows it on the
 * next visit: POST { tags: ["products", "product:aero-v3"] }.
 */
export async function POST(req: NextRequest) {
  if (!(await isStaff(req))) return NextResponse.json({ message: "Not allowed" }, { status: 403 });

  const body = (await req.json().catch(() => null)) as { tags?: unknown } | null;
  const tags = Array.isArray(body?.tags) ? body.tags.filter((tag): tag is string => typeof tag === "string") : [];
  const valid = [...new Set(tags.filter((tag) => TAG.test(tag)))].slice(0, 20);
  // expire: 0, not "max": staff expect the next visit to show their edit, not a stale page while it refreshes.
  for (const tag of valid) revalidateTag(tag, { expire: 0 });

  return NextResponse.json({ revalidated: valid });
}
