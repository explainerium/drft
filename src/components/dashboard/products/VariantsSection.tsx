"use client";

import { PlusIcon, SparklesIcon, Trash2Icon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useFieldArray, useFormContext, useFormState, useWatch } from "react-hook-form";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AdminAttribute } from "@/types/adminCatalog";
import { NativeSelect } from "./fields";
import { emptyVariant, missingCombinations, type ProductFormValues } from "./productForm";

/**
 * Variants: the options the product varies by (attributes), one row per
 * sellable combination with its own SKU, price and stock. "Generate" adds the
 * missing combinations of the values chosen.
 */
export function VariantsSection({ attributes }: { attributes: AdminAttribute[] }) {
  const t = useTranslations("admin.product.variants");
  const { control, register, setValue, getValues } = useFormContext<ProductFormValues>();
  const { errors } = useFormState({ control, name: "variants" });
  const { fields, append, remove, replace } = useFieldArray({ control, name: "variants", keyName: "key" });
  const attributeIds = useWatch({ control, name: "attributeIds" });
  const variants = useWatch({ control, name: "variants" });
  const images = useWatch({ control, name: "images" });
  const [generating, setGenerating] = useState(false);

  const axes = attributeIds
    .map((id) => attributes.find((a) => a.id === id))
    .filter((a): a is AdminAttribute => !!a);
  const available = attributes.filter((a) => !attributeIds.includes(a.id) && a.values.length > 0);

  const addAxis = (id: string) => setValue("attributeIds", [...attributeIds, id], { shouldDirty: true });
  const removeAxis = (id: string) => {
    setValue(
      "attributeIds",
      attributeIds.filter((a) => a !== id),
      { shouldDirty: true },
    );
    getValues("variants").forEach((variant, index) => {
      if (!(id in variant.values)) return;
      const rest = Object.fromEntries(Object.entries(variant.values).filter(([key]) => key !== id));
      setValue(`variants.${index}.values`, rest, { shouldDirty: true });
    });
  };

  const setDefault = (index: number) =>
    getValues("variants").forEach((variant, i) => {
      if (variant.isDefault !== (i === index)) setValue(`variants.${i}.isDefault`, i === index, { shouldDirty: true });
    });

  const listError = errors.variants?.root?.message ?? errors.variants?.message;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("hint")}</CardDescription>
        <CardAction className="flex gap-2">
          {axes.length > 0 && (
            <Button type="button" variant="outline" size="sm" onClick={() => setGenerating(true)}>
              <SparklesIcon />
              {t("generate")}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append(emptyVariant(getValues("variants.0.price") ?? ""))}
          >
            <PlusIcon />
            {t("add")}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{t("options")}</span>
          {axes.map((axis) => (
            <span
              key={axis.id}
              className="inline-flex h-7 items-center gap-1 rounded-full bg-secondary pr-1 pl-3 text-sm"
            >
              {axis.name}
              <button
                type="button"
                aria-label={t("removeOption", { name: axis.name })}
                onClick={() => removeAxis(axis.id)}
                className="flex size-5 items-center justify-center rounded-full hover:bg-accent"
              >
                <XIcon className="size-3" />
              </button>
            </span>
          ))}
          {available.length > 0 && (
            <NativeSelect
              aria-label={t("addOption")}
              value=""
              onChange={(event) => event.target.value && addAxis(event.target.value)}
              className="w-44"
            >
              <option value="">{t("addOption")}</option>
              {available.map((attribute) => (
                <option key={attribute.id} value={attribute.id}>
                  {attribute.name}
                </option>
              ))}
            </NativeSelect>
          )}
          {axes.length === 0 && <span className="text-xs text-muted-foreground">{t("noOptions")}</span>}
        </div>

        <div className="-mx-4 overflow-x-auto border-y">
          <Table className="min-w-[1180px] table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-20 pl-4">{t("columns.default")}</TableHead>
                {axes.map((axis) => (
                  <TableHead key={axis.id} className="w-40">
                    {axis.name}
                  </TableHead>
                ))}
                <TableHead className="w-48">{t("columns.sku")}</TableHead>
                <TableHead className="w-28">{t("columns.price")}</TableHead>
                <TableHead className="w-28">{t("columns.compareAt")}</TableHead>
                <TableHead className="w-24">{t("columns.stock")}</TableHead>
                <TableHead className="w-44">{t("columns.flags")}</TableHead>
                <TableHead className="w-36">{t("columns.image")}</TableHead>
                <TableHead className="w-24">{t("columns.weight")}</TableHead>
                <TableHead className="w-14 pr-4">
                  <span className="sr-only">{t("columns.remove")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => {
                const variant = variants[index] ?? field;
                const rowErrors = errors.variants?.[index];
                const comboError = (rowErrors?.values as { message?: string } | undefined)?.message;
                return (
                  <TableRow key={field.key} className={variant.isActive ? undefined : "bg-secondary/50"}>
                    <TableCell className="pl-4">
                      <input
                        type="radio"
                        name="default-variant"
                        aria-label={t("makeDefault", { number: index + 1 })}
                        checked={variant.isDefault}
                        onChange={() => setDefault(index)}
                        className="size-4 accent-brand"
                      />
                    </TableCell>
                    {axes.map((axis) => {
                      const missing = !!(rowErrors?.values as Record<string, unknown> | undefined)?.[axis.id];
                      return (
                        <TableCell key={axis.id}>
                          <NativeSelect
                            aria-label={t("optionValue", { option: axis.name, number: index + 1 })}
                            aria-invalid={missing || !!comboError || undefined}
                            value={variant.values[axis.id] ?? ""}
                            onChange={(event) =>
                              setValue(
                                `variants.${index}.values`,
                                { ...getValues(`variants.${index}.values`), [axis.id]: event.target.value },
                                { shouldDirty: true, shouldValidate: !!rowErrors },
                              )
                            }
                          >
                            <option value="">—</option>
                            {axis.values.map((value) => (
                              <option key={value.id} value={value.id}>
                                {value.label}
                              </option>
                            ))}
                          </NativeSelect>
                        </TableCell>
                      );
                    })}
                    <TableCell>
                      <Input
                        aria-label={t("columns.sku")}
                        aria-invalid={!!rowErrors?.sku || undefined}
                        {...register(`variants.${index}.sku`)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        aria-label={t("columns.price")}
                        inputMode="decimal"
                        aria-invalid={!!rowErrors?.price || undefined}
                        title={rowErrors?.price?.message}
                        {...register(`variants.${index}.price`)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        aria-label={t("columns.compareAt")}
                        inputMode="decimal"
                        aria-invalid={!!rowErrors?.compareAtPrice || undefined}
                        title={rowErrors?.compareAtPrice?.message}
                        {...register(`variants.${index}.compareAtPrice`)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        aria-label={t("columns.stock")}
                        inputMode="numeric"
                        disabled={!variant.manageStock}
                        aria-invalid={!!rowErrors?.stock || undefined}
                        title={rowErrors?.stock?.message}
                        {...register(`variants.${index}.stock`)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-xs">
                        <label className="flex items-center gap-1.5">
                          <input type="checkbox" className="accent-brand" {...register(`variants.${index}.manageStock`)} />
                          {t("manageStock")}
                        </label>
                        <label className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            className="accent-brand"
                            {...register(`variants.${index}.allowBackorder`)}
                          />
                          {t("allowBackorder")}
                        </label>
                        <label className="flex items-center gap-1.5">
                          <input type="checkbox" className="accent-brand" {...register(`variants.${index}.isActive`)} />
                          {t("isActive")}
                        </label>
                      </div>
                    </TableCell>
                    <TableCell>
                      <NativeSelect aria-label={t("columns.image")} {...register(`variants.${index}.imageAssetId`)}>
                        <option value="">{t("noImage")}</option>
                        {images.map((image, i) => (
                          <option key={image.assetId} value={image.assetId}>
                            {t("imageNumber", { number: i + 1 })}
                          </option>
                        ))}
                      </NativeSelect>
                    </TableCell>
                    <TableCell>
                      <Input
                        aria-label={t("columns.weight")}
                        inputMode="decimal"
                        aria-invalid={!!rowErrors?.weightKg || undefined}
                        title={rowErrors?.weightKg?.message}
                        {...register(`variants.${index}.weightKg`)}
                      />
                    </TableCell>
                    <TableCell className="pr-4">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("remove", { number: index + 1 })}
                        disabled={fields.length === 1}
                        onClick={() => {
                          const wasDefault = getValues(`variants.${index}.isDefault`);
                          remove(index);
                          if (wasDefault) setValue("variants.0.isDefault", true, { shouldDirty: true });
                        }}
                      >
                        <Trash2Icon />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <VariantErrors />
        {listError && <p className="text-xs font-medium text-destructive">{listError}</p>}
      </CardContent>
      {generating && (
        <GenerateDialog
          axes={axes}
          onClose={() => setGenerating(false)}
          onGenerate={(chosen) => {
            const current = getValues("variants");
            const added = missingCombinations({ attributeIds, variants: current }, chosen);
            // A new variant row with no option picked yet is a placeholder; generated rows replace it.
            const kept = current.filter((v) => v.id || Object.values(v.values).some(Boolean));
            const next = [...kept, ...added];
            if (next.length && !next.some((v) => v.isDefault)) next[0] = { ...next[0], isDefault: true };
            replace(next);
            setGenerating(false);
          }}
        />
      )}
    </Card>
  );
}

/** One line per invalid row, so errors in a wide table are not missed. */
function VariantErrors() {
  const t = useTranslations("admin.product.variants");
  const { control } = useFormContext<ProductFormValues>();
  const { errors } = useFormState({ control, name: "variants" });
  const rows = Array.isArray(errors.variants) ? errors.variants : [];
  const lines = rows.flatMap((row, index) => {
    if (!row) return [];
    const messages = [
      (row.values as { message?: string } | undefined)?.message,
      ...Object.values((row.values as Record<string, { message?: string }> | undefined) ?? {}).map((e) => e?.message),
      row.price?.message,
      row.compareAtPrice?.message,
      row.stock?.message,
      row.weightKg?.message,
      row.sku?.message,
    ].filter((m): m is string => !!m);
    return messages.length ? [t("rowError", { number: index + 1, message: [...new Set(messages)].join(" ") })] : [];
  });
  if (lines.length === 0) return null;
  return (
    <ul role="alert" className="flex flex-col gap-0.5 text-xs font-medium text-destructive">
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}

function GenerateDialog({
  axes,
  onClose,
  onGenerate,
}: {
  axes: AdminAttribute[];
  onClose: () => void;
  onGenerate: (chosen: Record<string, string[]>) => void;
}) {
  const t = useTranslations("admin.product.variants");
  const [chosen, setChosen] = useState<Record<string, string[]>>({});
  const toggle = (axisId: string, valueId: string) =>
    setChosen((current) => {
      const values = current[axisId] ?? [];
      return {
        ...current,
        [axisId]: values.includes(valueId) ? values.filter((v) => v !== valueId) : [...values, valueId],
      };
    });
  const count = axes.reduce((product, axis) => product * (chosen[axis.id]?.length ?? 0), 1);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("generateTitle")}</DialogTitle>
          <DialogDescription>{t("generateHint")}</DialogDescription>
        </DialogHeader>
        {axes.map((axis) => (
          <fieldset key={axis.id} className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">{axis.name}</legend>
            <div className="flex flex-wrap gap-1.5">
              {axis.values.map((value) => {
                const on = chosen[axis.id]?.includes(value.id) ?? false;
                return (
                  <button
                    key={value.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(axis.id, value.id)}
                    className={
                      on
                        ? "inline-flex h-8 items-center gap-1.5 rounded-full bg-primary px-3 text-sm text-primary-foreground"
                        : "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm ring-1 ring-foreground/15 hover:bg-accent"
                    }
                  >
                    {value.hexColor && (
                      <span
                        aria-hidden
                        className="size-3 rounded-full ring-1 ring-foreground/20"
                        style={{ backgroundColor: value.hexColor }}
                      />
                    )}
                    {value.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="button" disabled={count === 0} onClick={() => onGenerate(chosen)}>
            {t("generateCount", { count })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
