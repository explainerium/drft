/**
 * The storefront's message catalog as site texts: one flat entry per string,
 * keyed by its path ("home.hero.title"). The admin's own texts share the
 * English file but are not part of the site.
 */

export type Catalog = { [key: string]: string | Catalog };
export type FlatTexts = Record<string, string>;

const ADMIN_NAMESPACE = "admin";

/** Every site text of a catalog, in file order. */
export function siteTextsOf(catalog: Catalog): FlatTexts {
  const out: FlatTexts = {};
  const walk = (node: Catalog, prefix: string) => {
    for (const [key, value] of Object.entries(node)) {
      if (!prefix && key === ADMIN_NAMESPACE) continue;
      const path = prefix ? `${prefix}.${key}` : key;
      if (typeof value === "string") out[path] = value;
      else walk(value, path);
    }
  };
  walk(catalog, "");
  return out;
}

/** The catalog without the admin's texts, each text replaced by `text(key, value)`. */
export function mapSiteTexts(catalog: Catalog, text: (key: string, value: string) => string, prefix = ""): Catalog {
  const out: Catalog = {};
  for (const [key, value] of Object.entries(catalog)) {
    if (!prefix && key === ADMIN_NAMESPACE) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    out[key] = typeof value === "string" ? text(path, value) : mapSiteTexts(value, text, path);
  }
  return out;
}

/** A changed text, if there is one for this key (never an inherited property such as "constructor"). */
export const changedText = (changes: Record<string, string>, key: string): string | undefined =>
  Object.hasOwn(changes, key) ? changes[key] : undefined;
