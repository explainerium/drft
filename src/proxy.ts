import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, STAFF_ROLES } from "./constants/auth";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// Storefront areas that need a session, with or without a locale prefix.
const PROTECTED = /^(?:\/[a-z]{2})?\/account(?:\/|$)/;

const redirectTo = (req: NextRequest, pathname: string) => {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  url.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
};

/**
 * Locale routing for the storefront, plus fast redirects for signed-out
 * visitors. The redirects are UX only: the API authorizes every request.
 */
export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const role = req.cookies.get(SESSION_COOKIE)?.value;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const isLogin = pathname === "/admin/login";
    const isStaff = !!role && (STAFF_ROLES as readonly string[]).includes(role);
    if (!isLogin && !isStaff) return redirectTo(req, "/admin/login");
    return NextResponse.next();
  }

  if (PROTECTED.test(pathname) && !role) return redirectTo(req, "/login");

  return intlMiddleware(req);
}

export const config = {
  // Everything except the API rewrite, Next/Vercel internals and files with an extension.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
