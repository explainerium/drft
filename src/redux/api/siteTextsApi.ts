import type { Locale } from "@/i18n/routing";
import { baseApi } from "./baseApi";

/** Storefront texts changed in the admin. The message files are the defaults; these replace single strings. */

export interface StoredSiteText {
  key: string;
  locale: Locale;
  value: string;
  updatedAt: string;
  updatedBy: string | null;
}

export interface SiteTextRevision {
  id: string;
  locale: Locale;
  /** null: the text went back to the default. */
  value: string | null;
  createdAt: string;
  changedBy: string | null;
}

/** An empty value goes back to the default. */
export interface SiteTextChange {
  key: string;
  locale: Locale;
  value: string;
}

interface Envelope<T> {
  data: T;
}

export const siteTextsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getStoredSiteTexts: build.query<StoredSiteText[], void>({
      query: () => "/site-texts/admin",
      transformResponse: (response: Envelope<StoredSiteText[]>) => response.data,
      providesTags: ["SiteText"],
    }),
    getSiteTextHistory: build.query<SiteTextRevision[], string>({
      query: (key) => ({ url: "/site-texts/admin/history", params: { key } }),
      transformResponse: (response: Envelope<SiteTextRevision[]>) => response.data,
      providesTags: (_result, _error, key) => [{ type: "SiteText", id: key }],
    }),
    saveSiteTexts: build.mutation<{ saved: number; reset: number }, SiteTextChange[]>({
      query: (changes) => ({ url: "/site-texts/admin", method: "PUT", body: { changes } }),
      transformResponse: (response: Envelope<{ saved: number; reset: number }>) => response.data,
      invalidatesTags: ["SiteText"],
    }),
  }),
});

export const { useGetStoredSiteTextsQuery, useGetSiteTextHistoryQuery, useSaveSiteTextsMutation } = siteTextsApi;
