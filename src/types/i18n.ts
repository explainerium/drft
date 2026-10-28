/**
 * Texts in other languages, as the API stores them next to the German
 * columns: { en: { <field>: <text> } }. Missing or empty fields fall back to German.
 */
export type Translations<K extends string> = { en?: Partial<Record<K, string>> } | null;

/** Form values as the stored shape: trimmed, empty fields left out, null when nothing is filled in. */
export function toTranslations<K extends string>(en: Record<K, string>): Translations<K> {
  const filled = Object.fromEntries(
    Object.entries<string>(en)
      .map(([key, value]) => [key, value.trim()])
      .filter(([, value]) => value),
  ) as Partial<Record<K, string>>;
  return Object.keys(filled).length ? { en: filled } : null;
}
