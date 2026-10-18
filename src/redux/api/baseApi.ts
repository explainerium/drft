import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { tagTypes } from "../tag-types";

/**
 * Browser calls go to /api/v1 on this same origin; next.config.ts rewrites them
 * to the backend, so auth cookies are first-party and no CORS is involved.
 * Feature endpoints are added with baseApi.injectEndpoints() in sibling files.
 */
const rawBaseQuery = fetchBaseQuery({ baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "/api/v1" });

// One refresh at a time: parallel 401s wait for the same refresh call instead
// of each rotating the token (which the backend would treat as reuse).
let refreshing: Promise<boolean> | null = null;

const refreshSession = (api: Parameters<BaseQueryFn>[1], extraOptions: object) =>
  (refreshing ??= Promise.resolve(rawBaseQuery({ url: "/auth/refresh", method: "POST" }, api, extraOptions))
    .then((result) => !result.error)
    .finally(() => {
      refreshing = null;
    }));

/** The access token lives 15 minutes; on a 401, refresh once and retry. */
const baseQueryWithRefresh: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  const url = typeof args === "string" ? args : args.url;
  if (result.error?.status === 401 && !url.startsWith("/auth/")) {
    if (await refreshSession(api, extraOptions)) {
      result = await rawBaseQuery(args, api, extraOptions);
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithRefresh,
  tagTypes,
  endpoints: () => ({}),
});
