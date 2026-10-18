import type { ProductVariant } from "@/types/catalog";

/** attributeId → valueId */
export type Selection = Record<string, string>;

export const selectionOf = (variant: ProductVariant): Selection =>
  Object.fromEntries(variant.attributes.map((a) => [a.attributeId, a.valueId]));

const matches = (variant: ProductVariant, selection: Selection) =>
  Object.entries(selection).every(([attributeId, valueId]) =>
    variant.attributes.some((a) => a.attributeId === attributeId && a.valueId === valueId),
  );

export const defaultVariant = (variants: ProductVariant[]): ProductVariant | undefined =>
  variants.find((v) => v.isDefault) ?? variants[0];

/**
 * The variant to show after the shopper picks `valueId` for `attributeId`:
 * the one that keeps every other choice, else the closest one that has the
 * picked value (in stock first), so a click never leads to "no such variant".
 */
export function pickVariant(
  variants: ProductVariant[],
  current: Selection,
  attributeId: string,
  valueId: string,
): ProductVariant | undefined {
  const wanted = { ...current, [attributeId]: valueId };
  const exact = variants.find((v) => matches(v, wanted));
  if (exact) return exact;

  const withValue = variants.filter((v) => matches(v, { [attributeId]: valueId }));
  const score = (v: ProductVariant) =>
    Object.entries(current).filter(([a, val]) => a !== attributeId && matches(v, { [a]: val })).length;
  return withValue.sort((a, b) => Number(b.inStock) - Number(a.inStock) || score(b) - score(a))[0];
}

/** Can this value be bought together with the other current choices? Unavailable values stay clickable but look muted. */
export function isAvailable(
  variants: ProductVariant[],
  current: Selection,
  attributeId: string,
  valueId: string,
): boolean {
  const wanted = { ...current, [attributeId]: valueId };
  return variants.some((v) => matches(v, wanted) && (v.inStock || v.allowBackorder));
}
