import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { draftMode } from "next/headers";
import type { Locale } from "@/i18n/routing";
import { apiGet } from "@/lib/api/server";
import defaultCatalog from "../../../messages/de.json";
import { changedText, mapSiteTexts, siteTextsOf, type Catalog } from "./catalog";
import { checkText } from "./check";
import { marker } from "./markers";

/** Every site text's key. In edit mode a text's marker is its position here. */
export const SITE_TEXT_KEYS = Object.keys(siteTextsOf(defaultCatalog));

const keyIndex = new Map(SITE_TEXT_KEYS.map((key, index) => [key, index]));

/** Texts changed in the admin, { key: text }, in one language. A save revalidates the tag. */
export async function getSiteTexts(locale: Locale): Promise<Record<string, string>> {
  "use cache";
  cacheLife("hours");
  cacheTag("site-texts");
  return (await apiGet<Record<string, string>>("/site-texts", undefined, locale)).data;
}

/** Whether this request is in the staff's on-page text editing (Next.js Draft Mode). */
export async function isEditingTexts(): Promise<boolean> {
  return (await draftMode()).isEnabled;
}

/**
 * The storefront messages: the catalog without the admin's texts, with the
 * texts changed in the admin in place. A change that would not format (broken
 * syntax, a value the page does not pass) is skipped and the default shows, so
 * an edit can never break a page; neither can the API being down. In edit mode
 * every text also starts with its marker.
 */
export async function storefrontMessages(catalog: Catalog, locale: Locale): Promise<Catalog> {
  const [changes, editing] = await Promise.all([
    getSiteTexts(locale).catch((error: unknown) => {
      console.error("Site texts are unavailable; showing the defaults.", error);
      return {};
    }),
    isEditingTexts(),
  ]);

  return mapSiteTexts(catalog, (key, value) => {
    const changed = changedText(changes, key);
    const text = changed !== undefined && checkText(changed, value).issue === null ? changed : value;
    const index = editing ? keyIndex.get(key) : undefined;
    return index === undefined ? text : marker(index) + text;
  });
}
