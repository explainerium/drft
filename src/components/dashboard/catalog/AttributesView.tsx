"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PencilIcon, PlusIcon, SlidersHorizontalIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  revalidateStorefront,
  useCreateAttributeMutation,
  useCreateAttributeValueMutation,
  useDeleteAttributeMutation,
  useDeleteAttributeValueMutation,
  useGetAdminAttributesQuery,
  useUpdateAttributeMutation,
  useUpdateAttributeValueMutation,
} from "@/redux/api/adminCatalogApi";
import type { AdminAttribute, AttributeValue } from "@/types/adminCatalog";
import { apiErrorMessage, apiFieldErrors } from "@/utils/apiError";
import { PageHeader, QueryError } from "../AdminPage";
import { errorProps, FormField } from "../products/fields";

type Editing =
  | { kind: "attribute"; attribute?: AdminAttribute }
  | { kind: "value"; attribute: AdminAttribute; value?: AttributeValue };

const usedBy = (value: AttributeValue) => value._count?.variants ?? 0;

/** Options products vary by (Kite Size, Colorway) and their values. */
export function AttributesView() {
  const t = useTranslations("admin.attributes");
  const { data, isLoading, isError, refetch } = useGetAdminAttributesQuery();
  const [editing, setEditing] = useState<Editing | null>(null);

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Button onClick={() => setEditing({ kind: "attribute" })}>
            <PlusIcon />
            {t("new")}
          </Button>
        }
      />
      {isError ? (
        <QueryError onRetry={refetch} />
      ) : isLoading || !data ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 panel py-12 text-sm text-muted-foreground">
          <SlidersHorizontalIcon className="size-5" aria-hidden />
          {t("empty")}
        </div>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-2">
          {data.map((attribute) => {
            const variants = attribute.values.reduce((sum, v) => sum + usedBy(v), 0);
            return (
              <Card key={attribute.id}>
                <CardHeader>
                  <CardTitle>{attribute.name}</CardTitle>
                  <CardDescription>
                    {t("summary", { code: attribute.code, values: attribute.values.length, variants })}
                  </CardDescription>
                  <CardAction className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("editAttribute", { name: attribute.name })}
                      onClick={() => setEditing({ kind: "attribute", attribute })}
                    >
                      <PencilIcon />
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {attribute.values.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("noValues")}</p>
                  ) : (
                    <ul className="flex flex-wrap gap-1.5">
                      {attribute.values.map((value) => (
                        <li key={value.id}>
                          <button
                            type="button"
                            onClick={() => setEditing({ kind: "value", attribute, value })}
                            title={t("valueUsage", { count: usedBy(value) })}
                            className="inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-sm ring-1 ring-foreground/15 transition-colors hover:bg-accent"
                          >
                            {value.hexColor && (
                              <span
                                aria-hidden
                                className="size-3.5 rounded-full ring-1 ring-foreground/20"
                                style={{ backgroundColor: value.hexColor }}
                              />
                            )}
                            {value.label}
                            <span className="text-xs text-muted-foreground tabular-nums">{usedBy(value)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="self-start"
                    onClick={() => setEditing({ kind: "value", attribute })}
                  >
                    <PlusIcon />
                    {t("addValue")}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      {editing?.kind === "attribute" && (
        <AttributeDialog attribute={editing.attribute} onClose={() => setEditing(null)} />
      )}
      {editing?.kind === "value" && (
        <ValueDialog attribute={editing.attribute} value={editing.value} onClose={() => setEditing(null)} />
      )}
    </>
  );
}

const sortOrderField = (message: string) => z.string().trim().regex(/^\d{1,7}$/, message);

function AttributeDialog({ attribute, onClose }: { attribute?: AdminAttribute; onClose: () => void }) {
  const t = useTranslations("admin.attributes");
  const uid = useId();
  const [create, creating] = useCreateAttributeMutation();
  const [update, updating] = useUpdateAttributeMutation();
  const [remove, removing] = useDeleteAttributeMutation();
  const [confirming, setConfirming] = useState(false);
  const used = attribute ? attribute.values.some((v) => usedBy(v) > 0) : false;

  const schema = z.object({
    name: z.string().trim().min(1, t("errors.required")).max(80, t("errors.tooLong")),
    code: z.string().trim().max(60, t("errors.tooLong")),
    sortOrder: sortOrderField(t("errors.whole")),
  });
  type Values = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: attribute?.name ?? "", code: attribute?.code ?? "", sortOrder: String(attribute?.sortOrder ?? 0) },
  });

  const onSubmit = handleSubmit(async (values) => {
    const body = {
      name: values.name.trim(),
      ...(values.code.trim() ? { code: values.code.trim() } : {}),
      sortOrder: Number(values.sortOrder),
    };
    try {
      if (attribute) await update({ id: attribute.id, body }).unwrap();
      else await create(body).unwrap();
      await revalidateStorefront([]);
      toast.success(t("saved", { name: body.name }));
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
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{attribute ? attribute.name : t("new")}</DialogTitle>
            <DialogDescription>{t("attributeHint")}</DialogDescription>
          </DialogHeader>
          <FormField id={id("name")} label={t("fields.name")} error={errors.name?.message}>
            <Input id={id("name")} maxLength={80} {...errorProps(id("name"), errors.name?.message)} {...register("name")} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id={id("code")} label={t("fields.code")} hint={t("fields.codeHint")} error={errors.code?.message}>
              <Input id={id("code")} maxLength={60} {...errorProps(id("code"), errors.code?.message)} {...register("code")} />
            </FormField>
            <FormField id={id("sort")} label={t("fields.sortOrder")} error={errors.sortOrder?.message}>
              <Input
                id={id("sort")}
                inputMode="numeric"
                {...errorProps(id("sort"), errors.sortOrder?.message)}
                {...register("sortOrder")}
              />
            </FormField>
          </div>
          <DialogFooter className="sm:justify-between">
            {attribute ? (
              used ? (
                <p className="self-center text-xs text-muted-foreground">{t("inUse")}</p>
              ) : confirming ? (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={removing.isLoading}
                    onClick={async () => {
                      try {
                        await remove(attribute.id).unwrap();
                        toast.success(t("deleted", { name: attribute.name }));
                        onClose();
                      } catch (error) {
                        toast.error(apiErrorMessage(error) ?? t("failed"));
                      }
                    }}
                  >
                    {t("confirmDelete")}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(false)}>
                    {t("keep")}
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setConfirming(true)}
                >
                  <Trash2Icon />
                  {t("delete")}
                </Button>
              )
            ) : (
              <span />
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={onClose}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={creating.isLoading || updating.isLoading}>
                {t("save")}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const HEX = /^#[0-9a-fA-F]{6}$/;

function ValueDialog({
  attribute,
  value,
  onClose,
}: {
  attribute: AdminAttribute;
  value?: AttributeValue;
  onClose: () => void;
}) {
  const t = useTranslations("admin.attributes");
  const uid = useId();
  const [create, creating] = useCreateAttributeValueMutation();
  const [update, updating] = useUpdateAttributeValueMutation();
  const [remove, removing] = useDeleteAttributeValueMutation();
  const [confirming, setConfirming] = useState(false);
  const count = value ? usedBy(value) : 0;

  const schema = z.object({
    label: z.string().trim().min(1, t("errors.required")).max(80, t("errors.tooLong")),
    code: z.string().trim().max(60, t("errors.tooLong")),
    hexColor: z
      .string()
      .trim()
      .refine((v) => v === "" || HEX.test(v), t("errors.hex")),
    sortOrder: sortOrderField(t("errors.whole")),
  });
  type Values = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: value?.label ?? "",
      code: value?.code ?? "",
      hexColor: value?.hexColor ?? "",
      sortOrder: String(value?.sortOrder ?? attribute.values.length),
    },
  });
  const hex = useWatch({ control, name: "hexColor" });

  const onSubmit = handleSubmit(async (values) => {
    const body = {
      label: values.label.trim(),
      ...(values.code.trim() ? { code: values.code.trim() } : {}),
      hexColor: values.hexColor.trim() || null,
      sortOrder: Number(values.sortOrder),
    };
    try {
      if (value) await update({ valueId: value.id, body }).unwrap();
      else await create({ attributeId: attribute.id, body }).unwrap();
      // Labels and swatches show on product pages and cards.
      await revalidateStorefront([]);
      toast.success(t("valueSaved", { label: body.label }));
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
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{value ? value.label : t("newValue", { attribute: attribute.name })}</DialogTitle>
            <DialogDescription>
              {value ? t("valueUsage", { count }) : t("valueHint", { attribute: attribute.name })}
            </DialogDescription>
          </DialogHeader>
          <FormField id={id("label")} label={t("fields.label")} error={errors.label?.message}>
            <Input id={id("label")} maxLength={80} {...errorProps(id("label"), errors.label?.message)} {...register("label")} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id={id("code")} label={t("fields.code")} hint={t("fields.valueCodeHint")} error={errors.code?.message}>
              <Input id={id("code")} maxLength={60} {...errorProps(id("code"), errors.code?.message)} {...register("code")} />
            </FormField>
            <FormField id={id("sort")} label={t("fields.sortOrder")} error={errors.sortOrder?.message}>
              <Input
                id={id("sort")}
                inputMode="numeric"
                {...errorProps(id("sort"), errors.sortOrder?.message)}
                {...register("sortOrder")}
              />
            </FormField>
          </div>
          <FormField id={id("hex")} label={t("fields.hexColor")} hint={t("fields.hexHint")} error={errors.hexColor?.message}>
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label={t("fields.pickColor")}
                value={HEX.test(hex) ? hex : "#ffffff"}
                onChange={(event) => setValue("hexColor", event.target.value, { shouldValidate: true })}
                className="h-8 w-10 cursor-pointer rounded-md border border-input bg-transparent p-0.5"
              />
              <Input
                id={id("hex")}
                placeholder="#1a1c1b"
                maxLength={7}
                {...errorProps(id("hex"), errors.hexColor?.message)}
                {...register("hexColor")}
              />
            </div>
          </FormField>
          <DialogFooter className="sm:justify-between">
            {value ? (
              count > 0 ? (
                <p className="self-center text-xs text-muted-foreground">{t("valueInUse")}</p>
              ) : confirming ? (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={removing.isLoading}
                    onClick={async () => {
                      try {
                        await remove(value.id).unwrap();
                        toast.success(t("valueDeleted", { label: value.label }));
                        onClose();
                      } catch (error) {
                        toast.error(apiErrorMessage(error) ?? t("failed"));
                      }
                    }}
                  >
                    {t("confirmDelete")}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(false)}>
                    {t("keep")}
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setConfirming(true)}
                >
                  <Trash2Icon />
                  {t("delete")}
                </Button>
              )
            ) : (
              <span />
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={onClose}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={creating.isLoading || updating.isLoading}>
                {t("save")}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
