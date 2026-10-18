/** The `message` of an API error response (RTK Query `error.data`), if there is one. */
export function apiErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("data" in error)) return null;
  const { data } = error as { data?: { message?: unknown } };
  return typeof data?.message === "string" ? data.message : null;
}
