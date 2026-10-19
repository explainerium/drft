/**
 * The `?next=` target after signing in, only when it is a path on this site.
 * "//evil.com" and "/\evil.com" are protocol-relative URLs in browsers, so they
 * fall back too.
 */
export function safeNext(next: string | null, fallback = "/account"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
