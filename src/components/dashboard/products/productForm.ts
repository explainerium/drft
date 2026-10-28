import { z } from "zod";
import type {
  AdminAttribute,
  AdminProduct,
  ProductContentInput,
  ProductInput,
  ProductStatus,
  ProductTranslations,
} from "@/types/adminCatalog";
import { toTranslations } from "@/types/i18n";
import { contentFormSchema, contentIssues, EMPTY_CONTENT, toContentForm, toContentInput } from "./productContentForm";

/**
 * The product editor's form: strings for every text input (empty means none),
 * converted to the API's ProductInput on save.
 */

const MONEY = /^\d{1,10}(\.\d{1,2})?$/;
const WEIGHT = /^\d{1,7}(\.\d{1,3})?$/;
const WHOLE = /^\d{1,7}$/;

type Translate = (key: string) => string;

export const productFormSchema = (t: Translate) => {
  const variant = z.object({
    id: z.string().optional(),
    sku: z.string().trim().max(64, t("errors.tooLong")),
    price: z.string().trim().regex(MONEY, t("errors.money")),
    compareAtPrice: z
      .string()
      .trim()
      .refine((v) => v === "" || MONEY.test(v), t("errors.money")),
    weightKg: z
      .string()
      .trim()
      .refine((v) => v === "" || WEIGHT.test(v), t("errors.weight")),
    stock: z.string().trim().regex(WHOLE, t("errors.whole")),
    manageStock: z.boolean(),
    allowBackorder: z.boolean(),
    isActive: z.boolean(),
    isDefault: z.boolean(),
    imageAssetId: z.string(),
    // attributeId → valueId for every option axis of the product.
    values: z.record(z.string(), z.string()),
  });

  return z
    .object({
      name: z.string().trim().min(1, t("errors.required")).max(160, t("errors.tooLong")),
      slug: z
        .string()
        .trim()
        .max(120, t("errors.tooLong"))
        .refine((v) => v === "" || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v), t("errors.slug")),
      status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
      badge: z.string().trim().max(40, t("errors.tooLong")),
      typeLabel: z.string().trim().max(60, t("errors.tooLong")),
      shortDescription: z.string().trim().max(1000, t("errors.tooLong")),
      description: z.string(),
      isFeatured: z.boolean(),
      sortOrder: z.string().trim().regex(WHOLE, t("errors.whole")),
      metaTitle: z.string().trim().max(160, t("errors.tooLong")),
      metaDescription: z.string().trim().max(320, t("errors.tooLong")),
      featuredAssetId: z.string().nullable(),
      categoryIds: z.array(z.string()),
      images: z.array(z.object({ assetId: z.string(), alt: z.string().trim().max(200), url: z.string() })),
      specs: z.array(
        z.object({
          group: z.string().trim().max(80, t("errors.tooLong")),
          label: z.string().trim().min(1, t("errors.required")).max(120, t("errors.tooLong")),
          value: z.string().trim().min(1, t("errors.required")).max(500, t("errors.tooLong")),
        }),
      ),
      related: z.array(z.object({ id: z.string(), name: z.string() })),
      attributeIds: z.array(z.string()),
      variants: z.array(variant).min(1, t("errors.noVariants")),
      content: contentFormSchema(t),
      // English texts; empty fields show the German ones on /en.
      en: z.object({
        name: z.string().trim().max(160, t("errors.tooLong")),
        badge: z.string().trim().max(40, t("errors.tooLong")),
        typeLabel: z.string().trim().max(60, t("errors.tooLong")),
        shortDescription: z.string().trim().max(1000, t("errors.tooLong")),
        description: z.string(),
        metaTitle: z.string().trim().max(160, t("errors.tooLong")),
        metaDescription: z.string().trim().max(320, t("errors.tooLong")),
      }),
      // Translated editorial blocks, kept as they are (no editor for them yet).
      enContent: z.unknown(),
    })
    .superRefine((form, ctx) => {
      for (const issue of contentIssues(form.content, t)) {
        ctx.addIssue({ code: "custom", path: ["content", ...issue.path], message: issue.message });
      }
      // Every variant needs a value on each option, and no two may be the same combination.
      const seen = new Map<string, number>();
      form.variants.forEach((variant, index) => {
        for (const attributeId of form.attributeIds) {
          if (!variant.values[attributeId]) {
            ctx.addIssue({
              code: "custom",
              path: ["variants", index, "values", attributeId],
              message: t("errors.option"),
            });
          }
        }
        const key = form.attributeIds.map((id) => variant.values[id] ?? "").join("|");
        if (form.attributeIds.length && seen.has(key)) {
          ctx.addIssue({ code: "custom", path: ["variants", index, "values"], message: t("errors.duplicate") });
        }
        seen.set(key, index);
      });
    });
};

export type ProductFormValues = z.infer<ReturnType<typeof productFormSchema>>;
export type VariantFormValues = ProductFormValues["variants"][number];

export const emptyVariant = (price = ""): VariantFormValues => ({
  sku: "",
  price,
  compareAtPrice: "",
  weightKg: "",
  stock: "0",
  manageStock: true,
  allowBackorder: false,
  isActive: true,
  isDefault: false,
  imageAssetId: "",
  values: {},
});

const EMPTY_EN = {
  name: "",
  badge: "",
  typeLabel: "",
  shortDescription: "",
  description: "",
  metaTitle: "",
  metaDescription: "",
};

export const EMPTY_PRODUCT: ProductFormValues = {
  name: "",
  slug: "",
  status: "DRAFT" satisfies ProductStatus,
  badge: "",
  typeLabel: "",
  shortDescription: "",
  description: "",
  isFeatured: false,
  sortOrder: "0",
  metaTitle: "",
  metaDescription: "",
  featuredAssetId: null,
  categoryIds: [],
  images: [],
  specs: [],
  related: [],
  attributeIds: [],
  variants: [{ ...emptyVariant(), isDefault: true }],
  content: EMPTY_CONTENT,
  en: EMPTY_EN,
  enContent: undefined,
};

/** The stored product as form values. Option axes are the attributes its variants use. */
export function toFormValues(product: AdminProduct, attributes: AdminAttribute[]): ProductFormValues {
  const attributeOf = new Map(attributes.flatMap((a) => a.values.map((v) => [v.id, a.id] as const)));
  const used = new Set(product.variants.flatMap((v) => v.attributeValueIds.map((id) => attributeOf.get(id))));
  const attributeIds = attributes.filter((a) => used.has(a.id)).map((a) => a.id);

  return {
    name: product.name,
    slug: product.slug,
    status: product.status,
    badge: product.badge ?? "",
    typeLabel: product.typeLabel ?? "",
    shortDescription: product.shortDescription ?? "",
    description: product.description ?? "",
    isFeatured: product.isFeatured,
    sortOrder: String(product.sortOrder),
    metaTitle: product.metaTitle ?? "",
    metaDescription: product.metaDescription ?? "",
    featuredAssetId: product.featuredAssetId,
    categoryIds: product.categoryIds,
    images: product.images.map((image) => ({
      assetId: image.assetId,
      alt: image.alt ?? "",
      url: image.asset.sizes.thumb?.url ?? image.asset.url,
    })),
    specs: product.specs.map((spec) => ({ group: spec.group ?? "", label: spec.label, value: spec.value })),
    related: product.related.map((r) => ({ id: r.id, name: r.name })),
    attributeIds,
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku ?? "",
      price: v.price,
      compareAtPrice: v.compareAtPrice ?? "",
      weightKg: v.weightKg ?? "",
      stock: String(v.stock),
      manageStock: v.manageStock,
      allowBackorder: v.allowBackorder,
      isActive: v.isActive,
      isDefault: v.isDefault,
      imageAssetId: v.imageAssetId ?? "",
      values: Object.fromEntries(
        v.attributeValueIds.flatMap((valueId) => {
          const attributeId = attributeOf.get(valueId);
          return attributeId ? [[attributeId, valueId]] : [];
        }),
      ),
    })),
    content: toContentForm(product),
    en: { ...EMPTY_EN, ...Object.fromEntries(Object.entries(product.translations?.en ?? {}).filter(([key]) => key in EMPTY_EN)) },
    enContent: product.translations?.en?.content,
  };
}

const orNull = (value: string) => (value.trim() === "" ? null : value.trim());

/** English texts (and kept translated blocks) as the stored JSON, or null when empty. */
function productTranslations(form: ProductFormValues): ProductTranslations {
  const texts = toTranslations(form.en)?.en ?? {};
  const content = form.enContent as ProductContentInput | undefined;
  const en = { ...texts, ...(content ? { content } : {}) };
  return Object.keys(en).length ? { en } : null;
}

/** Form values as the API payload. */
export function toProductInput(form: ProductFormValues): ProductInput {
  const imageIds = new Set(form.images.map((image) => image.assetId));
  const hasDefault = form.variants.some((v) => v.isDefault);
  return {
    name: form.name.trim(),
    ...(form.slug.trim() ? { slug: form.slug.trim() } : {}),
    status: form.status,
    badge: orNull(form.badge),
    typeLabel: orNull(form.typeLabel),
    shortDescription: orNull(form.shortDescription),
    description: orNull(form.description),
    isFeatured: form.isFeatured,
    sortOrder: Number(form.sortOrder),
    metaTitle: orNull(form.metaTitle),
    metaDescription: orNull(form.metaDescription),
    content: toContentInput(form.content),
    translations: productTranslations(form),
    // Only an image of this product can be its main image.
    featuredAssetId: form.featuredAssetId && imageIds.has(form.featuredAssetId) ? form.featuredAssetId : null,
    categoryIds: form.categoryIds,
    images: form.images.map((image, index) => ({ assetId: image.assetId, alt: orNull(image.alt), sortOrder: index })),
    specs: form.specs.map((spec, index) => ({
      group: orNull(spec.group),
      label: spec.label.trim(),
      value: spec.value.trim(),
      sortOrder: index,
    })),
    relatedIds: form.related.map((r) => r.id),
    variants: form.variants.map((v, index) => ({
      ...(v.id ? { id: v.id } : {}),
      sku: orNull(v.sku),
      price: v.price.trim(),
      compareAtPrice: orNull(v.compareAtPrice),
      weightKg: orNull(v.weightKg),
      stock: Number(v.stock),
      manageStock: v.manageStock,
      allowBackorder: v.allowBackorder,
      isActive: v.isActive,
      isDefault: hasDefault ? v.isDefault : index === 0,
      imageAssetId: v.imageAssetId && imageIds.has(v.imageAssetId) ? v.imageAssetId : null,
      sortOrder: index,
      attributeValueIds: form.attributeIds.map((id) => v.values[id]).filter((id): id is string => !!id),
    })),
  };
}

/**
 * Variants for every combination of the chosen values that the product does
 * not have yet. New ones copy the price of the first variant.
 */
export function missingCombinations(
  form: Pick<ProductFormValues, "attributeIds" | "variants">,
  chosen: Record<string, string[]>,
): VariantFormValues[] {
  const axes = form.attributeIds.map((id) => ({ id, values: chosen[id] ?? [] }));
  if (axes.length === 0 || axes.some((axis) => axis.values.length === 0)) return [];

  let combos: Record<string, string>[] = [{}];
  for (const axis of axes) {
    combos = combos.flatMap((combo) => axis.values.map((valueId) => ({ ...combo, [axis.id]: valueId })));
  }
  const key = (values: Record<string, string>) => form.attributeIds.map((id) => values[id] ?? "").join("|");
  const existing = new Set(form.variants.map((v) => key(v.values)));
  const price = form.variants[0]?.price ?? "";
  return combos.filter((combo) => !existing.has(key(combo))).map((values) => ({ ...emptyVariant(price), values }));
}
