import { draftMode } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { isStaffRequest } from "@/lib/api/staff";

/**
 * On-page text editing for staff, built on Next.js Draft Mode: while it is on,
 * pages render per request, skip every cache and mark each text for the editor
 * (src/lib/siteTexts). Other visitors keep getting the cached pages.
 *
 *   POST    staff only: editing on (sets the Draft Mode cookie)
 *   DELETE  editing off
 */
export async function POST(req: NextRequest) {
  if (!(await isStaffRequest(req))) return NextResponse.json({ message: "Not allowed" }, { status: 403 });
  (await draftMode()).enable();
  return NextResponse.json({ editing: true });
}

export async function DELETE() {
  (await draftMode()).disable();
  return NextResponse.json({ editing: false });
}
