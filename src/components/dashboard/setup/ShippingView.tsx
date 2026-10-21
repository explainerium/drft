"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PencilIcon, PlusIcon, Trash2Icon, TruckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
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
import { ADMIN_LINKS } from "@/constants/admin";
import { allCountries, EU_COUNTRIES } from "@/constants/countries";
import { cn } from "@/lib/utils";
import {
  useCreateRateMutation,
  useCreateZoneMutation,
  useDeleteRateMutation,
  useDeleteZoneMutation,
  useGetShippingZonesQuery,
  useSettingsGroup,
  useUpdateRateMutation,
  useUpdateZoneMutation,
} from "@/redux/api/adminSettingsApi";
import type { ShippingRate, ShippingZone } from "@/types/adminSettings";
import { apiErrorMessage, apiFieldErrors } from "@/utils/apiError";
import { PageHeader, QueryError, useAdminFormat } from "../AdminPage";
import { Checkbox, errorProps, FormField } from "../products/fields";

type Editing =
  | { kind: "zone"; zone?: ShippingZone }
  | { kind: "rate"; zone: ShippingZone; rate?: ShippingRate };

const MONEY = /^\d{1,10}(\.\d{1,2})?$/;
const SHOWN_COUNTRIES = 14;

/** Shipping zones (where the store ships) and their rates (what it costs). */
export function ShippingView() {
  const t = useTranslations("admin.shipping");
  const { data, isLoading, isError, refetch } = useGetShippingZonesQuery();
  const { data: shipping } = useSettingsGroup("shipping");
  const [editing, setEditing] = useState<Editing | null>(null);
  const f = useAdminFormat();
  const threshold = shipping?.freeShippingThreshold ?? null;

  return (
    <>
      <PageHeader
        title={t("title")}
        description={
          <>
            {threshold ? t("threshold", { amount: f.money(threshold) }) : t("noThreshold")}{" "}
            <Link href={ADMIN_LINKS.settings} className="font-medium text-brand hover:underline">
              {t("changeThreshold")}
            </Link>
          </>
        }
        actions={
          <Button onClick={() => setEditing({ kind: "zone" })}>
            <PlusIcon />
            {t("newZone")}
          </Button>
        }
      />
      {isError ? (
        <QueryError onRetry={refetch} />
      ) : isLoading || !data ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : data.length === 0 ? (
        <div className="panel flex flex-col items-center gap-2 py-12 text-sm text-muted-foreground">
          <TruckIcon className="size-5" aria-hidden />
          {t("empty")}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {data.map((zone) => (
            <ZonePanel key={zone.id} zone={zone} threshold={threshold} onEdit={setEditing} />
          ))}
        </div>
      )}
      {editing?.kind === "zone" && <ZoneDialog zone={editing.zone} onClose={() => setEditing(null)} />}
      {editing?.kind === "rate" && (
        <RateDialog zone={editing.zone} rate={editing.rate} threshold={threshold} onClose={() => setEditing(null)} />
      )}
    </>
  );
}

function ZonePanel({
  zone,
  threshold,
  onEdit,
}: {
  zone: ShippingZone;
  threshold: string | null;
  onEdit: (editing: Editing) => void;
}) {
  const t = useTranslations("admin.shipping");
  const f = useAdminFormat();
  const [showAll, setShowAll] = useState(false);
  const names = useMemo(() => new Intl.DisplayNames(["en"], { type: "region" }), []);
  const countries = showAll ? zone.countries : zone.countries.slice(0, SHOWN_COUNTRIES);

  return (
    <section className="panel overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
        <div className="flex flex-col gap-1">
          <h2 className="flex items-center gap-2 font-heading text-base font-semibold">
            {zone.name}
            {!zone.isActive && (
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                {t("inactive")}
              </span>
            )}
          </h2>
          <p className="text-xs text-muted-foreground">{t("countryCount", { count: zone.countries.length })}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => onEdit({ kind: "zone", zone })}>
          <PencilIcon />
          {t("editZone")}
        </Button>
      </div>
      <ul className="flex flex-wrap gap-1.5 px-5 pt-3">
        {countries.map((code) => (
          <li
            key={code}
            title={names.of(code)}
            className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs"
          >
            {code}
          </li>
        ))}
        {zone.countries.length > SHOWN_COUNTRIES && (
          <li>
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="rounded-md px-2 py-0.5 text-xs font-medium text-brand hover:underline"
            >
              {showAll ? t("showLess") : t("showMore", { count: zone.countries.length - SHOWN_COUNTRIES })}
            </button>
          </li>
        )}
      </ul>
      <div className="mt-4 border-t">
        {zone.rates.length === 0 ? (
          <p className="px-5 py-4 text-sm text-muted-foreground">{t("noRates")}</p>
        ) : (
          <ul>
            {zone.rates.map((rate) => (
              <li key={rate.id} className="border-b last:border-b-0">
                <button
                  type="button"
                  onClick={() => onEdit({ kind: "rate", zone, rate })}
                  className="flex w-full items-center gap-4 px-5 py-3 text-left transition-colors hover:bg-accent/50"
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className={cn("text-sm font-medium", !rate.isActive && "text-muted-foreground line-through")}>
                      {rate.name}
                    </span>
                    {rate.description && (
                      <span className="truncate text-xs text-muted-foreground">{rate.description}</span>
                    )}
                  </span>
                  {rate.freeOverThreshold && threshold && (
                    <span className="hidden rounded-md bg-brand-soft px-1.5 py-0.5 text-xs font-medium text-brand sm:inline">
                      {t("freeOver", { amount: f.money(threshold) })}
                    </span>
                  )}
                  {!rate.isActive && (
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{t("inactive")}</span>
                  )}
                  <span className="w-20 text-right text-sm font-semibold tabular-nums">
                    {rate.price === "0.00" ? t("free") : f.money(rate.price)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="border-t px-5 py-3">
          <Button variant="ghost" size="sm" onClick={() => onEdit({ kind: "rate", zone })}>
            <PlusIcon />
            {t("addRate")}
          </Button>
        </div>
      </div>
    </section>
  );
}

function ZoneDialog({ zone, onClose }: { zone?: ShippingZone; onClose: () => void }) {
  const t = useTranslations("admin.shipping");
  const uid = useId();
  const [create, creating] = useCreateZoneMutation();
  const [update, updating] = useUpdateZoneMutation();
  const [remove, removing] = useDeleteZoneMutation();
  const [name, setName] = useState(zone?.name ?? "");
  const [isActive, setIsActive] = useState(zone?.isActive ?? true);
  const [selected, setSelected] = useState<Set<string>>(new Set(zone?.countries ?? []));
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const countries = useMemo(() => allCountries(), []);
  const query = search.toLowerCase();
  const shown = countries.filter((c) => !query || c.name.toLowerCase().includes(query) || c.code.toLowerCase() === query);

  const toggle = (code: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });

  const save = async () => {
    setError(null);
    if (!name.trim()) return setError(t("errors.name"));
    if (selected.size === 0) return setError(t("errors.countries"));
    const body = { name: name.trim(), countries: [...selected].sort(), isActive, sortOrder: zone?.sortOrder ?? 0 };
    try {
      if (zone) await update({ id: zone.id, body }).unwrap();
      else await create(body).unwrap();
      toast.success(t("zoneSaved", { name: body.name }));
      onClose();
    } catch (err) {
      // 409 names the countries another active zone already has.
      setError(apiErrorMessage(err) ?? t("failed"));
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{zone ? zone.name : t("newZone")}</DialogTitle>
          <DialogDescription>{t("zoneHint")}</DialogDescription>
        </DialogHeader>
        <FormField id={`${uid}-name`} label={t("fields.zoneName")}>
          <Input
            id={`${uid}-name`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            placeholder={t("fields.zoneNamePlaceholder")}
          />
        </FormField>
        <div className="flex min-h-0 flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium">{t("fields.countries", { count: selected.size })}</span>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => setSelected((current) => new Set([...current, ...EU_COUNTRIES]))}
              >
                {t("addEu")}
              </Button>
              <Button type="button" variant="ghost" size="xs" onClick={() => setSelected(new Set())}>
                {t("clear")}
              </Button>
            </div>
          </div>
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchCountries")}
            aria-label={t("searchCountries")}
          />
          <ul className="grid max-h-64 min-h-0 grid-cols-1 gap-0.5 overflow-y-auto rounded-lg border p-1 sm:grid-cols-2">
            {shown.map((country) => (
              <li key={country.code}>
                <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/60">
                  <input
                    type="checkbox"
                    className="size-4 accent-brand"
                    checked={selected.has(country.code)}
                    onChange={() => toggle(country.code)}
                  />
                  <span className="min-w-0 flex-1 truncate">{country.name}</span>
                  <span className="text-xs text-subtle-foreground">{country.code}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
        <Checkbox label={t("fields.zoneActive")} checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
        {error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}
        <DialogFooter className="sm:justify-between">
          {zone ? (
            confirming ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={removing.isLoading}
                  onClick={async () => {
                    try {
                      await remove(zone.id).unwrap();
                      toast.success(t("zoneDeleted", { name: zone.name }));
                      onClose();
                    } catch (err) {
                      setError(apiErrorMessage(err) ?? t("failed"));
                    }
                  }}
                >
                  {t("confirmDeleteZone", { count: zone.rates.length })}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setConfirming(false)}>
                  {t("keep")}
                </Button>
              </div>
            ) : (
              <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirming(true)}>
                <Trash2Icon />
                {t("deleteZone")}
              </Button>
            )
          ) : (
            <span />
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button onClick={save} disabled={creating.isLoading || updating.isLoading}>
              {t("save")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RateDialog({
  zone,
  rate,
  threshold,
  onClose,
}: {
  zone: ShippingZone;
  rate?: ShippingRate;
  threshold: string | null;
  onClose: () => void;
}) {
  const t = useTranslations("admin.shipping");
  const f = useAdminFormat();
  const uid = useId();
  const [create, creating] = useCreateRateMutation();
  const [update, updating] = useUpdateRateMutation();
  const [remove, removing] = useDeleteRateMutation();
  const [confirming, setConfirming] = useState(false);

  const schema = z.object({
    name: z.string().trim().min(1, t("errors.required")).max(120),
    description: z.string().trim().max(300),
    price: z.string().trim().regex(MONEY, t("errors.money")),
    freeOverThreshold: z.boolean(),
    isActive: z.boolean(),
    sortOrder: z.string().trim().regex(/^\d{1,6}$/, t("errors.whole")),
  });
  type Values = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: rate?.name ?? "",
      description: rate?.description ?? "",
      price: rate?.price ?? "",
      freeOverThreshold: rate?.freeOverThreshold ?? false,
      isActive: rate?.isActive ?? true,
      sortOrder: String(rate?.sortOrder ?? zone.rates.length),
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const body = {
      ...values,
      name: values.name.trim(),
      description: values.description.trim() || null,
      sortOrder: Number(values.sortOrder),
    };
    try {
      if (rate) await update({ rateId: rate.id, body }).unwrap();
      else await create({ zoneId: zone.id, body }).unwrap();
      toast.success(t("rateSaved", { name: body.name }));
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
            <DialogTitle>{rate ? rate.name : t("addRate")}</DialogTitle>
            <DialogDescription>{t("rateHint", { zone: zone.name })}</DialogDescription>
          </DialogHeader>
          <FormField id={id("name")} label={t("fields.rateName")} error={errors.name?.message}>
            <Input id={id("name")} maxLength={120} {...errorProps(id("name"), errors.name?.message)} {...register("name")} />
          </FormField>
          <FormField id={id("description")} label={t("fields.description")} hint={t("fields.descriptionHint")}>
            <Input id={id("description")} maxLength={300} {...register("description")} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id={id("price")} label={t("fields.price")} hint={t("fields.priceHint")} error={errors.price?.message}>
              <Input
                id={id("price")}
                inputMode="decimal"
                placeholder="9.90"
                {...errorProps(id("price"), errors.price?.message)}
                {...register("price")}
              />
            </FormField>
            <FormField id={id("sort")} label={t("fields.sortOrder")} error={errors.sortOrder?.message}>
              <Input id={id("sort")} inputMode="numeric" {...register("sortOrder")} />
            </FormField>
          </div>
          <Checkbox
            label={
              threshold
                ? t("fields.freeOverThreshold", { amount: f.money(threshold) })
                : t("fields.freeOverThresholdOff")
            }
            {...register("freeOverThreshold")}
          />
          <Checkbox label={t("fields.rateActive")} {...register("isActive")} />
          <DialogFooter className="sm:justify-between">
            {rate ? (
              confirming ? (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={removing.isLoading}
                    onClick={async () => {
                      try {
                        await remove(rate.id).unwrap();
                        toast.success(t("rateDeleted", { name: rate.name }));
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
                  {t("deleteRate")}
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
