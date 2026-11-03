import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { isStaffRequest } from "@/lib/api/staff";

/** The cache tags the catalog, content and site text reads use (src/lib/catalog.ts, src/lib/content.ts, src/lib/siteTexts). */
const TAG = /^(?:products|categories|posts|pages|faq|settings|site-texts|(?:product|post|page):[a-z0-9-]{1,160})$/;

/**
 * Called by the admin after a catalog save so the storefront shows it on the
 * next visit: POST { tags: ["products", "product:aero-v3"] }. Staff only.
 */
export async function POST(req: NextRequest) {
  if (!(await isStaffRequest(req))) return NextResponse.json({ message: "Not allowed" }, { status: 403 });

  const body = (await req.json().catch(() => null)) as { tags?: unknown } | null;
  const tags = Array.isArray(body?.tags) ? body.tags.filter((tag): tag is string => typeof tag === "string") : [];
  const valid = [...new Set(tags.filter((tag) => TAG.test(tag)))].slice(0, 20);
  // expire: 0, not "max": staff expect the next visit to show their edit, not a stale page while it refreshes.
  for (const tag of valid) revalidateTag(tag, { expire: 0 });

  return NextResponse.json({ revalidated: valid });
}
