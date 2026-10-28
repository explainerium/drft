import "server-only";

/**
 * Server Components call the backend directly (not through the public /api/v1
 * rewrite, which would add a hop). The browser keeps using /api/v1 via RTK Query.
 */
const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:5005";

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

interface Envelope<T, M> {
  success: boolean;
  message: string;
  data: T;
  meta?: M;
}

/**
 * GET a public endpoint and unwrap the `{ success, data, meta }` envelope.
 * `locale` picks the content language (the API falls back to German).
 */
export async function apiGet<T, M = undefined>(
  path: string,
  query?: Record<string, string | number | undefined>,
  locale?: string,
): Promise<{ data: T; meta: M }> {
  const url = new URL(`/api/v1${path}`, API_ORIGIN);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }

  const res = await fetch(url, {
    headers: { accept: "application/json", ...(locale ? { "x-drft-locale": locale } : {}) },
  });
  const body = (await res.json().catch(() => null)) as Envelope<T, M> | null;

  if (!res.ok || !body?.success) {
    throw new ApiRequestError(res.status, body?.message ?? `Request failed: ${res.status}`);
  }
  return { data: body.data, meta: body.meta as M };
}
