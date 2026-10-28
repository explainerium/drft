"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EyeOffIcon, FolderTreeIcon, ImageIcon, ImagePlusIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  revalidateStorefront,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useGetAdminCategoriesQuery,
  useUpdateCategoryMutation,
} from "@/redux/api/adminCatalogApi";
import type { AdminCategory, CategoryInput } from "@/types/adminCatalog";
import { toTranslations } from "@/types/i18n";
import { apiErrorMessage, apiFieldErrors } from "@/utils/apiError";
import { PageHeader, QueryError } from "../AdminPage";
import { Checkbox, errorProps, FormField, NativeSelect } from "../products/fields";
import { MediaPicker, thumbOf } from "../products/MediaPicker";

/** Depth-first, so each category comes right after its parent. */
function flatten(categories: AdminCategory[], parentId: string | null = null, depth = 0): { category: AdminCategory; depth: number }[] {
  return categories
    .filter((c) => c.parentId === parentId)
    .flatMap((category) => [{ category, depth }, ...flatten(categories, category.id, depth + 1)]);
}

/** A category and everything under it: none of these can become its parent. */
function subtree(categories: AdminCategory[], id: string): Set<string> {
  const ids = new Set([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const c of categories) {
      if (c.parentId && ids.has(c.parentId) && !ids.has(c.id)) {
        ids.add(c.id);
        grew = true;
      }
    }
  }
  return ids;
}

export function CategoriesView() {
  const t = useTranslations("admin.categories");
  const { data, isLoading, isError, refetch } = useGetAdminCategoriesQuery();
  const [editing, setEditing] = useState<AdminCategory | "new" | null>(null);
  const rows = data ? flatten(data) : [];

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Button onClick={() => setEditing("new")}>
            <PlusIcon />
            {t("new")}
          </Button>
        }
      />
      {isError ? (
        <QueryError onRetry={refetch} />
      ) : (
        <div className="overflow-hidden panel">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">{t("columns.name")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("columns.slug")}</TableHead>
                <TableHead className="text-right">{t("columns.products")}</TableHead>
                <TableHead className="hidden pr-4 text-right sm:table-cell">{t("columns.sortOrder")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading || !data ? (
                Array.from({ length: 5 }, (_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4} className="px-4">
                      <Skeleton className="h-9 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    <FolderTreeIcon className="mx-auto mb-2 size-5" aria-hidden />
                    {t("empty")}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map(({ category, depth }) => (
                  <TableRow key={category.id} className="cursor-pointer" onClick={() => setEditing(category)}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3" style={{ paddingLeft: depth * 24 }}>
                        <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-secondary">
                          {category.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={category.image.sizes.thumb?.url ?? category.image.url}
                              alt=""
                              className="size-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="size-4 text-muted-foreground" aria-hidden />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setEditing(category);
                          }}
                          className="font-medium hover:underline"
                        >
                          {category.name}
                        </button>
                        {category.isHidden && (
                          <span className="inline-flex items-center gap-1 rounded-sm bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">
                            <EyeOffIcon className="size-3" aria-hidden />
                            {t("hidden")}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">/shop/{category.slug}</TableCell>
                    <TableCell className="text-right tabular-nums">{category.productCount}</TableCell>
                    <TableCell className="hidden pr-4 text-right text-muted-foreground tabular-nums sm:table-cell">
                      {category.sortOrder}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
      {editing && data && (
        <CategoryDialog
          key={editing === "new" ? "new" : editing.id}
          category={editing === "new" ? undefined : editing}
          categories={data}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function CategoryDialog({
  category,
  categories,
  onClose,
}: {
  category?: AdminCategory;
  categories: AdminCategory[];
  onClose: () => void;
}) {
  const t = useTranslations("admin.categories");
  const uid = useId();
  const [create, creating] = useCreateCategoryMutation();
  const [update, updating] = useUpdateCategoryMutation();
  const [picking, setPicking] = useState(false);
  const [image, setImage] = useState(category?.image ? { id: category.image.id, url: category.image.sizes.thumb?.url ?? category.image.url } : null);

  const schema = z.object({
    name: z.string().trim().min(1, t("errors.required")).max(120, t("errors.tooLong")),
    slug: z
      .string()
      .trim()
      .max(120, t("errors.tooLong"))
      .refine((v) => v === "" || SLUG.test(v), t("errors.slug")),
    parentId: z.string(),
    description: z.string().trim().max(2000, t("errors.tooLong")),
    sortOrder: z.string().trim().regex(/^\d{1,7}$/, t("errors.whole")),
    isHidden: z.boolean(),
    metaTitle: z.string().trim().max(160, t("errors.tooLong")),
    metaDescription: z.string().trim().max(320, t("errors.tooLong")),
    en: z.object({
      name: z.string().trim().max(120, t("errors.tooLong")),
      description: z.string().trim().max(2000, t("errors.tooLong")),
      metaTitle: z.string().trim().max(160, t("errors.tooLong")),
      metaDescription: z.string().trim().max(320, t("errors.tooLong")),
    }),
  });
  type Values = z.infer<typeof schema>;
  const en = category?.translations?.en;

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      parentId: category?.parentId ?? "",
      description: category?.description ?? "",
      sortOrder: String(category?.sortOrder ?? 0),
      isHidden: category?.isHidden ?? false,
      metaTitle: category?.metaTitle ?? "",
      metaDescription: category?.metaDescription ?? "",
      en: {
        name: en?.name ?? "",
        description: en?.description ?? "",
        metaTitle: en?.metaTitle ?? "",
        metaDescription: en?.metaDescription ?? "",
      },
    },
  });
  const name = useWatch({ control, name: "name" });

  const blocked = category ? subtree(categories, category.id) : new Set<string>();
  const parents = flatten(categories).filter(({ category: c }) => !blocked.has(c.id));

  const onSubmit = handleSubmit(async (values) => {
    const orNull = (v: string) => v.trim() || null;
    const body: CategoryInput = {
      name: values.name.trim(),
      ...(values.slug.trim() ? { slug: values.slug.trim() } : {}),
      parentId: values.parentId || null,
      description: orNull(values.description),
      imageAssetId: image?.id ?? null,
      sortOrder: Number(values.sortOrder),
      isHidden: values.isHidden,
      metaTitle: orNull(values.metaTitle),
      metaDescription: orNull(values.metaDescription),
      translations: toTranslations(values.en),
    };
    try {
      if (category) await update({ id: category.id, body }).unwrap();
      else await create(body).unwrap();
      await revalidateStorefront([]);
      toast.success(category ? t("saved", { name: body.name }) : t("created", { name: body.name }));
      onClose();
    } catch (error) {
      const fields = apiFieldErrors(error);
      for (const field of fields) setError(field.path as keyof Values, { message: field.message });
      if (fields.length === 0) toast.error(apiErrorMessage(error) ?? t("failed"));
    }
  });

  const id = (field: string) => `${uid}-${field}`;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{category ? category.name : t("new")}</DialogTitle>
            <DialogDescription>
              {category ? t("editHint", { count: category.productCount }) : t("newHint")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id={id("name")} label={t("fields.name")} error={errors.name?.message}>
              <Input id={id("name")} maxLength={120} {...errorProps(id("name"), errors.name?.message)} {...register("name")} />
            </FormField>
            <FormField id={id("slug")} label={t("fields.slug")} hint={t("fields.slugHint")} error={errors.slug?.message}>
              <Input
                id={id("slug")}
                maxLength={120}
                placeholder={t("fields.slugPlaceholder")}
                {...errorProps(id("slug"), errors.slug?.message)}
                {...register("slug")}
              />
            </FormField>
            <FormField id={id("parent")} label={t("fields.parent")} error={errors.parentId?.message}>
              <NativeSelect id={id("parent")} {...register("parentId")}>
                <option value="">{t("fields.noParent")}</option>
                {parents.map(({ category: c, depth }) => (
                  <option key={c.id} value={c.id}>
                    {"— ".repeat(depth)}
                    {c.name}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField
              id={id("sort")}
              label={t("fields.sortOrder")}
              hint={t("fields.sortOrderHint")}
              error={errors.sortOrder?.message}
            >
              <Input
                id={id("sort")}
                inputMode="numeric"
                {...errorProps(id("sort"), errors.sortOrder?.message)}
                {...register("sortOrder")}
              />
            </FormField>
          </div>

          <FormField
            id={id("description")}
            label={t("fields.description")}
            hint={t("fields.descriptionHint")}
            error={errors.description?.message}
          >
            <Textarea id={id("description")} rows={3} maxLength={2000} {...register("description")} />
          </FormField>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">{t("fields.image")}</span>
            <div className="flex items-center gap-3">
              <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image.url} alt="" className="size-full object-cover" />
                ) : (
                  <ImageIcon className="size-5 text-muted-foreground" aria-hidden />
                )}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setPicking(true)}>
                <ImagePlusIcon />
                {image ? t("fields.changeImage") : t("fields.chooseImage")}
              </Button>
              {image && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setImage(null)}>
                  <XIcon />
                  {t("fields.removeImage")}
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{t("fields.imageHint")}</p>
          </div>

          <Checkbox label={t("fields.isHidden")} {...register("isHidden")} />

          <details className="rounded-lg border px-3 py-2">
            <summary className="cursor-pointer text-sm font-medium">{t("fields.english")}</summary>
            <div className="mt-3 flex flex-col gap-4 pb-1">
              <p className="text-xs text-muted-foreground">{t("fields.englishHint")}</p>
              <FormField id={id("en-name")} label={t("fields.name")} error={errors.en?.name?.message}>
                <Input id={id("en-name")} maxLength={120} placeholder={name} {...register("en.name")} />
              </FormField>
              <FormField id={id("en-description")} label={t("fields.description")} error={errors.en?.description?.message}>
                <Textarea id={id("en-description")} rows={3} maxLength={2000} {...register("en.description")} />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField id={id("en-meta-title")} label={t("fields.metaTitle")} error={errors.en?.metaTitle?.message}>
                  <Input id={id("en-meta-title")} maxLength={160} {...register("en.metaTitle")} />
                </FormField>
                <FormField id={id("en-meta-description")} label={t("fields.metaDescription")} error={errors.en?.metaDescription?.message}>
                  <Input id={id("en-meta-description")} maxLength={320} {...register("en.metaDescription")} />
                </FormField>
              </div>
            </div>
          </details>

          <details className="rounded-lg border px-3 py-2">
            <summary className="cursor-pointer text-sm font-medium">{t("fields.seo")}</summary>
            <div className="mt-3 flex flex-col gap-4 pb-1">
              <FormField id={id("meta-title")} label={t("fields.metaTitle")} error={errors.metaTitle?.message}>
                <Input id={id("meta-title")} maxLength={160} placeholder={name} {...register("metaTitle")} />
              </FormField>
              <FormField
                id={id("meta-description")}
                label={t("fields.metaDescription")}
                error={errors.metaDescription?.message}
              >
                <Textarea id={id("meta-description")} rows={2} maxLength={320} {...register("metaDescription")} />
              </FormField>
            </div>
          </details>

          <DialogFooter className="sm:justify-between">
            {category ? <DeleteCategory category={category} onDeleted={onClose} /> : <span />}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={onClose}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={creating.isLoading || updating.isLoading}>
                {creating.isLoading || updating.isLoading ? t("saving") : category ? t("save") : t("create")}
              </Button>
            </div>
          </DialogFooter>
        </form>
        <MediaPicker
          single
          open={picking}
          onClose={() => setPicking(false)}
          exclude={image ? [image.id] : []}
          onPick={([asset]) => asset && setImage({ id: asset.id, url: thumbOf(asset) })}
        />
      </DialogContent>
    </Dialog>
  );
}

/** Two steps; the API refuses while subcategories exist and only unlinks products. */
function DeleteCategory({ category, onDeleted }: { category: AdminCategory; onDeleted: () => void }) {
  const t = useTranslations("admin.categories");
  const [remove, state] = useDeleteCategoryMutation();
  const [confirming, setConfirming] = useState(false);

  if (category.childCount > 0) {
    return <p className="self-center text-xs text-muted-foreground">{t("hasChildren")}</p>;
  }
  if (!confirming) {
    return (
      <Button
        type="button"
        variant="ghost"
        className="text-destructive hover:text-destructive"
        onClick={() => setConfirming(true)}
      >
        <Trash2Icon />
        {t("delete")}
      </Button>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm">{t("confirmDelete", { count: category.productCount })}</span>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={state.isLoading}
        onClick={async () => {
          try {
            await remove(category.id).unwrap();
            await revalidateStorefront([]);
            toast.success(t("deleted", { name: category.name }));
            onDeleted();
          } catch (error) {
            toast.error(apiErrorMessage(error) ?? t("failed"));
          }
        }}
      >
        {t("delete")}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(false)}>
        {t("keep")}
      </Button>
    </div>
  );
}
