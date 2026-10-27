"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CopyIcon, ExternalLinkIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Controller, FormProvider, useForm, useFormState, useWatch, type FieldPath } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { ADMIN_LINKS } from "@/constants/admin";
import {
  revalidateStorefront,
  useCreateProductMutation,
  useDeleteProductMutation,
  useDuplicateProductMutation,
  useGetAdminAttributesQuery,
  useGetAdminProductQuery,
  useUpdateProductMutation,
} from "@/redux/api/adminCatalogApi";
import type { AdminAttribute, AdminProduct } from "@/types/adminCatalog";
import { apiErrorMessage, apiFieldErrors } from "@/utils/apiError";
import { PageHeader, QueryError } from "../AdminPage";
import { Checkbox, errorProps, FormField, NativeSelect } from "./fields";
import { ProductContentSection } from "./ProductContentSection";
import {
  CategoriesSection,
  ImagesSection,
  RelatedSection,
  SeoSection,
  SpecsSection,
} from "./ProductSections";
import { ProductStatusBadge } from "./ProductStatusBadge";
import { EMPTY_PRODUCT, productFormSchema, toFormValues, toProductInput, type ProductFormValues } from "./productForm";
import { RichTextEditor } from "./RichTextEditor";
import { VariantsSection } from "./VariantsSection";

const editorSkeleton = (
  <div aria-hidden className="flex flex-col gap-6">
    <Skeleton className="h-14 w-72" />
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <Skeleton className="h-[600px] rounded-xl" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  </div>
);

/** New product (no id) or an existing one. */
export function ProductEditor({ id }: { id?: string }) {
  const t = useTranslations("admin.product");
  const attributes = useGetAdminAttributesQuery();
  const product = useGetAdminProductQuery(id ?? "", { skip: !id });
  const back = { href: ADMIN_LINKS.products, label: t("back") };

  if (attributes.isError || product.isError) {
    const error = product.error;
    const missing = !!error && "status" in error && (error.status === 404 || error.status === 400);
    return (
      <>
        <PageHeader title={t("notFoundTitle")} back={back} />
        <QueryError
          onRetry={() => (attributes.isError ? attributes.refetch() : product.refetch())}
          message={missing ? t("notFound") : undefined}
        />
      </>
    );
  }
  if (!attributes.data || (id && !product.data)) return editorSkeleton;

  return (
    <ProductForm
      // A different product (or the first save of a new one) starts a fresh form.
      key={product.data?.id ?? "new"}
      product={product.data}
      attributes={attributes.data}
    />
  );
}

function ProductForm({ product, attributes }: { product?: AdminProduct; attributes: AdminAttribute[] }) {
  const t = useTranslations("admin.product");
  const router = useRouter();
  const [create, creating] = useCreateProductMutation();
  const [update, updating] = useUpdateProductMutation();
  const saving = creating.isLoading || updating.isLoading;
  // Next keeps recently visited pages mounted but hidden, so two editors can be in the DOM at once.
  const uid = useId();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema((key) => t(key as Parameters<typeof t>[0]))),
    defaultValues: product ? toFormValues(product, attributes) : EMPTY_PRODUCT,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });
  const { control, register, handleSubmit, setError, reset } = form;
  const { errors, isDirty } = useFormState({ control });
  const name = useWatch({ control, name: "name" });

  // Leaving with unsaved changes asks first (reloads and closing the tab).
  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const onSubmit = handleSubmit(
    async (values) => {
      const body = toProductInput(values);
      try {
        const saved = product
          ? await update({ id: product.id, body }).unwrap()
          : await create(body).unwrap();
        await revalidateStorefront([...new Set([product?.slug, saved.slug].filter((s): s is string => !!s))]);
        toast.success(product ? t("saved") : t("created"));
        if (product) reset(toFormValues(saved, attributes));
        else {
          // The hidden "new product" page stays mounted; the next visit must start empty.
          reset(EMPTY_PRODUCT);
          router.replace(ADMIN_LINKS.product(saved.id));
        }
      } catch (error) {
        const fields = apiFieldErrors(error);
        for (const field of fields) setError(field.path as FieldPath<ProductFormValues>, { message: field.message });
        toast.error(apiErrorMessage(error) ?? t("failed"));
      }
    },
    () => toast.error(t("invalid")),
  );

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
        {/* Sticky under the top bar, so Save is in reach anywhere on a long product. */}
        <div className="sticky top-14 z-10 -mx-4 -mt-4 border-b bg-surface px-4 pt-4 pb-3 sm:-mx-6 sm:-mt-6 sm:px-6 sm:pt-6 md:top-0 lg:-mx-8 lg:-mt-7 lg:px-8 lg:pt-7">
          <PageHeader
            back={{ href: ADMIN_LINKS.products, label: t("back") }}
            title={
              <span className="flex flex-wrap items-center gap-3">
                {name.trim() || t("untitled")}
                {product && <ProductStatusBadge status={product.status} />}
              </span>
            }
            description={product ? t("lastSaved", { slug: product.slug }) : t("newHint")}
            actions={
              <>
                {product && <DuplicateButton product={product} disabled={isDirty} />}
                {product?.status === "PUBLISHED" && (
                  <Button asChild variant="outline">
                    <a href={`/products/${product.slug}`} target="_blank" rel="noopener">
                      <ExternalLinkIcon />
                      {t("viewInStore")}
                    </a>
                  </Button>
                )}
                <Button type="submit" disabled={saving || (!!product && !isDirty)}>
                  {saving ? t("saving") : product ? t("save") : t("create")}
                </Button>
              </>
            }
          />
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("general.title")}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <FormField id={`${uid}product-name`} label={t("general.name")} error={errors.name?.message}>
                  <Input
                    id={`${uid}product-name`}
                    maxLength={160}
                    {...errorProps(`${uid}product-name`, errors.name?.message)}
                    {...register("name")}
                  />
                </FormField>
                <FormField
                  id={`${uid}product-slug`}
                  label={t("general.slug")}
                  hint={t("general.slugHint")}
                  error={errors.slug?.message}
                >
                  <Input
                    id={`${uid}product-slug`}
                    maxLength={120}
                    placeholder={t("general.slugPlaceholder")}
                    {...errorProps(`${uid}product-slug`, errors.slug?.message)}
                    {...register("slug")}
                  />
                </FormField>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    id={`${uid}product-type`}
                    label={t("general.typeLabel")}
                    hint={t("general.typeLabelHint")}
                    error={errors.typeLabel?.message}
                  >
                    <Input id={`${uid}product-type`} maxLength={60} {...register("typeLabel")} />
                  </FormField>
                  <FormField
                    id={`${uid}product-badge`}
                    label={t("general.badge")}
                    hint={t("general.badgeHint")}
                    error={errors.badge?.message}
                  >
                    <Input id={`${uid}product-badge`} maxLength={40} {...register("badge")} />
                  </FormField>
                </div>
                <FormField
                  id={`${uid}product-short`}
                  label={t("general.shortDescription")}
                  hint={t("general.shortDescriptionHint")}
                  error={errors.shortDescription?.message}
                >
                  <Textarea id={`${uid}product-short`} rows={2} maxLength={1000} {...register("shortDescription")} />
                </FormField>
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium">
                    {t("general.description")}
                  </span>
                  <Controller
                    control={control}
                    name="description"
                    render={({ field }) => (
                      <RichTextEditor
                        id={`${uid}product-description`}
                        label={t("general.description")}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>
              </CardContent>
            </Card>
            <ImagesSection />
            <VariantsSection attributes={attributes} />
            <ProductContentSection />
            <SpecsSection />
            <SeoSection />
          </div>

          <div className="flex min-w-0 flex-col gap-6">
            <Card size="sm">
              <CardHeader>
                <CardTitle>{t("visibility.title")}</CardTitle>
                <CardDescription>{t("visibility.hint")}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <FormField id={`${uid}product-status`} label={t("visibility.status")}>
                  <NativeSelect id={`${uid}product-status`} {...register("status")}>
                    <option value="DRAFT">{t("visibility.DRAFT")}</option>
                    <option value="PUBLISHED">{t("visibility.PUBLISHED")}</option>
                    <option value="ARCHIVED">{t("visibility.ARCHIVED")}</option>
                  </NativeSelect>
                </FormField>
                <Checkbox label={t("visibility.featured")} {...register("isFeatured")} />
                <FormField
                  id={`${uid}product-sort`}
                  label={t("visibility.sortOrder")}
                  hint={t("visibility.sortOrderHint")}
                  error={errors.sortOrder?.message}
                >
                  <Input
                    id={`${uid}product-sort`}
                    inputMode="numeric"
                    {...errorProps(`${uid}product-sort`, errors.sortOrder?.message)}
                    {...register("sortOrder")}
                  />
                </FormField>
              </CardContent>
            </Card>
            <CategoriesSection />
            <RelatedSection productId={product?.id} />
            {product && <DeleteCard product={product} />}
          </div>
        </div>
      </form>
    </FormProvider>
  );
}

/** A draft copy of the saved product; the editor opens it. Unsaved changes would not be in the copy. */
function DuplicateButton({ product, disabled }: { product: AdminProduct; disabled: boolean }) {
  const t = useTranslations("admin.product.duplicate");
  const router = useRouter();
  const [duplicate, state] = useDuplicateProductMutation();

  const run = async () => {
    try {
      const copy = await duplicate(product.id).unwrap();
      toast.success(t("done", { name: copy.name }));
      router.push(ADMIN_LINKS.product(copy.id));
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? t("failed"));
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled || state.isLoading}
      title={disabled ? t("saveFirst") : undefined}
      onClick={run}
    >
      <CopyIcon />
      {state.isLoading ? t("working") : t("button")}
    </Button>
  );
}

function DeleteCard({ product }: { product: AdminProduct }) {
  const t = useTranslations("admin.product.delete");
  const router = useRouter();
  const [remove, state] = useDeleteProductMutation();
  const [confirming, setConfirming] = useState(false);

  const confirm = async () => {
    try {
      await remove(product.id).unwrap();
      await revalidateStorefront([product.slug]);
      toast.success(t("done", { name: product.name }));
      router.replace(ADMIN_LINKS.products);
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? t("failed"));
    }
  };

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("hint")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          type="button"
          variant="outline"
          className="w-full text-destructive hover:text-destructive"
          onClick={() => setConfirming(true)}
        >
          <Trash2Icon />
          {t("button")}
        </Button>
      </CardContent>
      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("confirmTitle", { name: product.name })}</DialogTitle>
            <DialogDescription>{t("confirmBody")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirming(false)}>
              {t("cancel")}
            </Button>
            <Button type="button" variant="destructive" disabled={state.isLoading} onClick={confirm}>
              {t("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
