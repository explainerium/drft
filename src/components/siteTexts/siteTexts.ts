import { ACCOUNT_LINKS } from "@/constants/navigation";
import { FEATURES } from "@/constants/features";
import type { Locale } from "@/i18n/routing";
import type { FlatTexts } from "@/lib/siteTexts/catalog";
import { checkText, type TextIssue } from "@/lib/siteTexts/check";
import type { StoredSiteText } from "@/redux/api/siteTextsApi";

/** Shared by the admin list and the on-page editor. */

export type SiteTextDefaults = Record<Locale, FlatTexts>;

/** Sections of the list in the order of a visit; `path` is where "Edit on the site" opens them. */
export const SITE_TEXT_GROUPS = [
  { key: "layout", path: "/" },
  { key: "home", path: "/" },
  { key: "shop", path: "/shop" },
  { key: "product", path: "/shop" },
  { key: "cart", path: ACCOUNT_LINKS.cart },
  { key: "checkout", path: "/checkout" },
  { key: "order", path: ACCOUNT_LINKS.orders },
  { key: "auth", path: ACCOUNT_LINKS.login },
  { key: "account", path: ACCOUNT_LINKS.account },
  { key: "wishlist", path: ACCOUNT_LINKS.wishlist },
  { key: "content", path: "/contact" },
  { key: "notFound", path: "/404" },
] as const;

export type SiteTextGroup = (typeof SITE_TEXT_GROUPS)[number]["key"];

/**
 * Texts not offered for editing: sections that are switched off, and the
 * search engine defaults, which Settings › SEO replaces.
 */
const HIDDEN = ["metadata.", ...(FEATURES.journal ? [] : ["content.journal."]), ...(FEATURES.faq ? [] : ["content.faq."])];

export const isEditableText = (key: string) =>
  !HIDDEN.some((prefix) => key.startsWith(prefix)) && SITE_TEXT_GROUPS.some((group) => key.startsWith(`${group.key}.`));

export const groupOf = (key: string) => key.slice(0, key.indexOf(".")) as SiteTextGroup;

/** "checkout.address.postalCode" → "Address › Postal code". */
export function textLabel(key: string): string {
  return key
    .split(".")
    .slice(1)
    .map((part) => {
      const words = part.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[-_]/g, " ").toLowerCase();
      return words.charAt(0).toUpperCase() + words.slice(1);
    })
    .join(" › ");
}

export const textId = (locale: Locale, key: string) => `${locale}:${key}`;

export const storedById = (rows: StoredSiteText[] | undefined) =>
  new Map((rows ?? []).map((row) => [textId(row.locale, row.key), row]));

/** What saving a field stores: "" (back to the default) when it is empty or reads like the default. */
export const changeOf = (value: string, original: string) => {
  const text = value.trim();
  return text === original.trim() ? "" : text;
};

/** Why a field's value can't be saved, if it can't. An empty field is fine: it means the default. */
export const issueOf = (value: string, original: string): TextIssue | null => {
  const text = changeOf(value, original);
  return text ? checkText(text, original).issue : null;
};
