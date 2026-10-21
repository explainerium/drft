"use client";

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ImageIcon,
  ImagePlusIcon,
  PlusIcon,
  StarIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState, type ReactNode } from "react";
import { useFieldArray, useFormContext, useFormState, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useGetAdminCategoriesQuery, useGetAdminProductsQuery } from "@/redux/api/adminCatalogApi";
import type { AdminCategory } from "@/types/adminCatalog";
import { cn } from "@/lib/utils";
import { SearchBox } from "../SearchBox";
import { MediaPicker, thumbOf } from "./MediaPicker";
import { errorProps, FormField } from "./fields";
import type { ProductFormValues } from "./productForm";

/** Product photos: add from the library, reorder, alt text, and the main image (star). */
export function ImagesSection() {
  const t = useTranslations("admin.product.images");
  const { control, register, setValue } = useFormContext<ProductFormValues>();
  const { fields, append, remove, swap } = useFieldArray({ control, name: "images", keyName: "key" });
  const featuredAssetId = useWatch({ control, name: "featuredAssetId" });
  const [picking, setPicking] = useState(false);
  // With no main image chosen, the storefront uses the first one.
  const mainId = featuredAssetId ?? fields[0]?.assetId;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("hint")}</CardDescription>
        <CardAction>
          <Button type="button" variant="outline" size="sm" onClick={() => setPicking(true)}>
            <ImagePlusIcon />
            {t("add")}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {fields.length === 0 ? (
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="flex w-full flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-sm text-muted-foreground hover:bg-accent/50"
          >
            <ImageIcon className="size-5" aria-hidden />
            {t("empty")}
          </button>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {fields.map((image, index) => {
              const isMain = image.assetId === mainId;
              return (
                <li key={image.key} className="flex flex-col gap-2">
                  <div
                    className={cn(
                      "group relative aspect-square overflow-hidden rounded-lg bg-secondary",
                      isMain && "ring-2 ring-brand",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image.url} alt="" className="size-full object-cover" />
                    <div className="absolute inset-x-1 top-1 flex justify-between">
                      <Button
                        type="button"
                        size="icon-xs"
                        variant="secondary"
                        aria-label={isMain ? t("isMain") : t("makeMain")}
                        aria-pressed={isMain}
                        title={isMain ? t("isMain") : t("makeMain")}
                        onClick={() => setValue("featuredAssetId", image.assetId, { shouldDirty: true })}
                      >
                        <StarIcon className={cn(isMain && "fill-amber-500 text-amber-500")} />
                      </Button>
                      <Button
                        type="button"
                        size="icon-xs"
                        variant="secondary"
                        aria-label={t("remove")}
                        title={t("remove")}
                        onClick={() => {
                          if (featuredAssetId === image.assetId) setValue("featuredAssetId", null, { shouldDirty: true });
                          remove(index);
                        }}
                      >
                        <XIcon />
                      </Button>
                    </div>
                    <div className="absolute inset-x-1 bottom-1 flex justify-between">
                      <Button
                        type="button"
                        size="icon-xs"
                        variant="secondary"
                        aria-label={t("moveLeft")}
                        disabled={index === 0}
                        onClick={() => swap(index, index - 1)}
                      >
                        <ArrowLeftIcon />
                      </Button>
                      <Button
                        type="button"
                        size="icon-xs"
                        variant="secondary"
                        aria-label={t("moveRight")}
                        disabled={index === fields.length - 1}
                        onClick={() => swap(index, index + 1)}
                      >
                        <ArrowRightIcon />
                      </Button>
                    </div>
                  </div>
                  <Input
                    aria-label={t("alt", { number: index + 1 })}
                    placeholder={t("altPlaceholder")}
                    maxLength={200}
                    {...register(`images.${index}.alt`)}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
      <MediaPicker
        open={picking}
        onClose={() => setPicking(false)}
        exclude={fields.map((image) => image.assetId)}
        onPick={(assets) =>
          append(assets.map((asset) => ({ assetId: asset.id, alt: asset.alt ?? "", url: thumbOf(asset) })))
        }
      />
    </Card>
  );
}

/** Categories as a tree of checkboxes; hidden ones are marked. */
export function CategoriesSection() {
  const t = useTranslations("admin.product.categories");
  const { control, setValue } = useFormContext<ProductFormValues>();
  const selected = useWatch({ control, name: "categoryIds" });
  const { data: categories = [], isLoading } = useGetAdminCategoriesQuery();

  const children = (parentId: string | null) => categories.filter((c) => c.parentId === parentId);
  const toggle = (id: string) =>
    setValue("categoryIds", selected.includes(id) ? selected.filter((c) => c !== id) : [...selected, id], {
      shouldDirty: true,
    });

  const renderLevel = (parentId: string | null, depth: number): ReactNode =>
    children(parentId).map((category: AdminCategory) => (
      <li key={category.id}>
        <label
          className="flex cursor-pointer items-center gap-2 rounded-md py-1 pr-2 text-sm hover:bg-accent/60"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          <input
            type="checkbox"
            className="size-4 accent-brand"
            checked={selected.includes(category.id)}
            onChange={() => toggle(category.id)}
          />
          <span className="min-w-0 flex-1 truncate">{category.name}</span>
          {category.isHidden && <span className="text-xs text-muted-foreground">{t("hidden")}</span>}
        </label>
        {children(category.id).length > 0 && <ul>{renderLevel(category.id, depth + 1)}</ul>}
      </li>
    ));

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">…</p>
        ) : categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <ul className="-mx-2 max-h-72 overflow-y-auto">{renderLevel(null, 0)}</ul>
        )}
      </CardContent>
    </Card>
  );
}

/** Spec table rows ("Weight: 3.2 kg"), optionally grouped. */
export function SpecsSection() {
  const t = useTranslations("admin.product.specs");
  const { control, register } = useFormContext<ProductFormValues>();
  const { errors } = useFormState({ control, name: "specs" });
  const { fields, append, remove, swap } = useFieldArray({ control, name: "specs", keyName: "key" });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("hint")}</CardDescription>
        <CardAction>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ group: "", label: "", value: "" })}>
            <PlusIcon />
            {t("add")}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {fields.map((spec, index) => {
              const rowErrors = errors.specs?.[index];
              return (
                <li key={spec.key} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-[1fr_1fr_1.5fr_auto]">
                  <Input
                    aria-label={t("group")}
                    placeholder={t("group")}
                    className="col-span-2 sm:col-span-1"
                    {...register(`specs.${index}.group`)}
                  />
                  <Input
                    aria-label={t("label")}
                    placeholder={t("label")}
                    className="col-span-2 sm:col-span-1"
                    {...errorProps(`spec-${index}-label`, rowErrors?.label?.message)}
                    {...register(`specs.${index}.label`)}
                  />
                  <Input
                    aria-label={t("value")}
                    placeholder={t("value")}
                    {...errorProps(`spec-${index}-value`, rowErrors?.value?.message)}
                    {...register(`specs.${index}.value`)}
                  />
                  <div className="flex gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("moveUp")}
                      disabled={index === 0}
                      onClick={() => swap(index, index - 1)}
                    >
                      <ArrowUpIcon />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("remove")}
                      onClick={() => remove(index)}
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                  {(rowErrors?.label || rowErrors?.value) && (
                    <p className="col-span-full text-xs font-medium text-destructive">{t("required")}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/** "Related products" on the PDP: search the catalog and add. */
export function RelatedSection({ productId }: { productId?: string }) {
  const t = useTranslations("admin.product.related");
  const { control } = useFormContext<ProductFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "related", keyName: "key" });
  const [search, setSearch] = useState("");
  const { data, isFetching } = useGetAdminProductsQuery({ search, limit: 8 }, { skip: !search });
  const taken = new Set([...fields.map((f) => f.id), productId]);
  const results = (data?.data ?? []).filter((p) => !taken.has(p.id));

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("hint")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {fields.length > 0 && (
          <ul className="flex flex-col gap-1">
            {fields.map((product, index) => (
              <li key={product.key} className="flex items-center gap-2 rounded-md bg-secondary px-2 py-1.5 text-sm">
                <span className="min-w-0 flex-1 truncate">{product.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={t("remove", { name: product.name })}
                  onClick={() => remove(index)}
                >
                  <XIcon />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <SearchBox defaultValue="" placeholder={t("search")} onSearch={setSearch} />
        {search && (
          <ul className="flex flex-col">
            {results.length === 0 ? (
              <li className="px-2 py-1.5 text-sm text-muted-foreground">{isFetching ? "…" : t("noResults")}</li>
            ) : (
              results.map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => append({ id: product.id, name: product.name })}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                  >
                    <PlusIcon className="size-3.5 shrink-0" />
                    <span className="truncate">{product.name}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/** Title and description for search engines; empty fields fall back to the product name and short text. */
export function SeoSection() {
  const t = useTranslations("admin.product.seo");
  const { register, control } = useFormContext<ProductFormValues>();
  const { errors } = useFormState({ control, name: ["metaTitle", "metaDescription"] });
  const [title, description] = useWatch({ control, name: ["metaTitle", "metaDescription"] });
  const uid = useId();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("hint")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <FormField
          id={`${uid}meta-title`}
          label={t("metaTitle")}
          hint={t("count", { count: title.length, max: 60 })}
          error={errors.metaTitle?.message}
        >
          <Input id={`${uid}meta-title`} maxLength={160} {...errorProps(`${uid}meta-title`, errors.metaTitle?.message)} {...register("metaTitle")} />
        </FormField>
        <FormField
          id={`${uid}meta-description`}
          label={t("metaDescription")}
          hint={t("count", { count: description.length, max: 160 })}
          error={errors.metaDescription?.message}
        >
          <textarea
            id={`${uid}meta-description`}
            rows={3}
            maxLength={320}
            className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            {...register("metaDescription")}
          />
        </FormField>
      </CardContent>
    </Card>
  );
}
