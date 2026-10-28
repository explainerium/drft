import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { PageMeta } from "@/types/catalog";
import type { ContentPage, FaqGroup, Post, PostCard, PublicSettings } from "@/types/content";
import type { Locale } from "@/i18n/routing";
import { requestLocale } from "./api/locale";
import { ApiRequestError, apiGet } from "./api/server";

/**
 * Cached content reads for Server Components. An admin save revalidates the
 * tags through /api/internal/revalidate.
 */

const orNull = async <T>(read: Promise<T>): Promise<T | null> => {
  try {
    return await read;
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 404) return null;
    throw err;
  }
};

export async function getPosts(query: {
  page?: number;
  limit?: number;
  tag?: string;
}): Promise<{ data: PostCard[]; meta: PageMeta }> {
  "use cache";
  cacheLife("minutes");
  cacheTag("posts");
  return apiGet<PostCard[], PageMeta>("/posts", { ...query });
}

/** Tags in use on published posts, most used first. */
export async function getPostTags(): Promise<{ tag: string; count: number }[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("posts");
  return (await apiGet<{ tag: string; count: number }[]>("/posts/tags")).data;
}

/** One published post, or null when the slug is unknown or not published. */
export async function getPost(slug: string): Promise<Post | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("posts", `post:${slug}`);
  return orNull(apiGet<Post>(`/posts/${encodeURIComponent(slug)}`).then((r) => r.data));
}

export async function getPage(slug: string): Promise<ContentPage | null> {
  return page(slug, await requestLocale());
}

async function page(slug: string, locale: Locale): Promise<ContentPage | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("pages", `page:${slug}`);
  return orNull(apiGet<ContentPage>(`/pages/${encodeURIComponent(slug)}`, undefined, locale).then((r) => r.data));
}

/** Published page slugs, for the sitemap (titles in German). */
export async function getPageList(): Promise<{ slug: string; title: string; updatedAt: string }[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("pages");
  return (await apiGet<{ slug: string; title: string; updatedAt: string }[]>("/pages")).data;
}

export async function getFaq(): Promise<FaqGroup[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("faq");
  return (await apiGet<FaqGroup[]>("/faq")).data;
}

export async function getPublicSettings(): Promise<PublicSettings> {
  return publicSettings(await requestLocale());
}

async function publicSettings(locale: Locale): Promise<PublicSettings> {
  "use cache";
  cacheLife("minutes");
  cacheTag("settings");
  return (await apiGet<PublicSettings>("/settings/public", undefined, locale)).data;
}
