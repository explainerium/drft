"use client";

import { PercentIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
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
import { allCountries } from "@/constants/countries";
import {
  useDeleteVatRateMutation,
  useGetShippingZonesQuery,
  useGetVatRatesQuery,
  useSaveSettingsMutation,
  useSaveVatRateMutation,
  useSettingsGroup,
} from "@/redux/api/adminSettingsApi";
import type { VatRate } from "@/types/adminSettings";
import { apiErrorMessage } from "@/utils/apiError";
import { PageHeader, QueryError, useAdminFormat } from "../AdminPage";
import { FormField, NativeSelect } from "../products/fields";

const RATE = /^\d{1,2}(\.\d{1,2})?$/;

const parseRate = (value: string): number | null => {
  const trimmed = value.trim().replace(",", ".");
  if (!RATE.test(trimmed)) return null;
  const rate = Number(trimmed);
  return rate <= 50 ? rate : null;
};

/** VAT per destination country; other countries use the default rate. Prices include VAT. */
export function VatView() {
  const t = useTranslations("admin.vat");
  const f = useAdminFormat();
  const { data, isLoading, isError, refetch } = useGetVatRatesQuery();
  const { data: zones } = useGetShippingZonesQuery();
  const [editing, setEditing] = useState<VatRate | "new" | null>(null);
  const names = useMemo(() => new Intl.DisplayNames(["en"], { type: "region" }), []);
  // Countries the store ships to without a rate of their own fall back to the default.
  const shipped = new Set((zones ?? []).filter((z) => z.isActive).flatMap((z) => z.countries));
  const missing = data ? [...shipped].filter((code) => !data.some((r) => r.countryCode === code)) : [];

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Button onClick={() => setEditing("new")}>
            <PlusIcon />
            {t("add")}
          </Button>
        }
      />
      <DefaultRate />
      {missing.length > 0 && (
        <p className="rounded-xl border border-signal/20 bg-signal-soft px-4 py-3 text-sm text-signal">
          {t("missing", { countries: missing.sort().join(", ") })}
        </p>
      )}
      {isError ? (
        <QueryError onRetry={refetch} />
      ) : (
        <div className="panel overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">{t("columns.country")}</TableHead>
                <TableHead>{t("columns.code")}</TableHead>
                <TableHead className="text-right">{t("columns.rate")}</TableHead>
                <TableHead className="hidden pr-5 text-right sm:table-cell">{t("columns.updated")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading || !data ? (
                <TableRow>
                  <TableCell colSpan={4} className="px-5">
                    <Skeleton className="h-40 w-full" />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    <PercentIcon className="mx-auto mb-2 size-5" aria-hidden />
                    {t("empty")}
                  </TableCell>
                </TableRow>
              ) : (
                [...data]
                  .sort((a, b) => (names.of(a.countryCode) ?? "").localeCompare(names.of(b.countryCode) ?? ""))
                  .map((rate) => (
                  <TableRow key={rate.countryCode} className="cursor-pointer" onClick={() => setEditing(rate)}>
                    <TableCell className="pl-5">
                      <button type="button" className="flex items-center gap-2 font-medium hover:underline">
                        {names.of(rate.countryCode) ?? rate.countryCode}
                      </button>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{rate.countryCode}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{t("percent", { rate: rate.rate })}</TableCell>
                    <TableCell className="hidden pr-5 text-right text-muted-foreground sm:table-cell">
                      {f.date(rate.updatedAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
      {editing && (
        <VatDialog
          key={editing === "new" ? "new" : editing.countryCode}
          rate={editing === "new" ? undefined : editing}
          taken={(data ?? []).map((r) => r.countryCode)}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

/** The rate for countries without their own (and for cart estimates before a country is known). */
function DefaultRate() {
  const t = useTranslations("admin.vat");
  const { data } = useSettingsGroup("tax");
  const [save, state] = useSaveSettingsMutation();
  const [value, setValue] = useState<string | null>(null);
  const shown = value ?? (data ? String(data.defaultVatRate) : "");
  const rate = parseRate(shown);
  const changed = data !== undefined && rate !== null && rate !== data.defaultVatRate;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (rate === null) return;
    try {
      await save({ group: "tax", body: { defaultVatRate: rate } }).unwrap();
      setValue(null);
      toast.success(t("defaultSaved"));
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? t("failed"));
    }
  };

  return (
    <form onSubmit={submit} className="panel flex flex-wrap items-end gap-4 p-5">
      <div className="flex min-w-60 flex-1 flex-col gap-1">
        <h2 className="font-heading text-[15px] font-semibold">{t("defaultTitle")}</h2>
        <p className="text-xs text-muted-foreground">{t("defaultHint")}</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative w-28">
          <Input
            aria-label={t("defaultTitle")}
            inputMode="decimal"
            value={shown}
            onChange={(event) => setValue(event.target.value)}
            aria-invalid={shown !== "" && rate === null ? true : undefined}
            className="pr-7"
          />
          <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-sm text-muted-foreground">
            %
          </span>
        </div>
        <Button type="submit" disabled={!changed || state.isLoading}>
          {t("save")}
        </Button>
      </div>
    </form>
  );
}

function VatDialog({ rate, taken, onClose }: { rate?: VatRate; taken: string[]; onClose: () => void }) {
  const t = useTranslations("admin.vat");
  const uid = useId();
  const [save, saving] = useSaveVatRateMutation();
  const [remove, removing] = useDeleteVatRateMutation();
  const [country, setCountry] = useState(rate?.countryCode ?? "");
  const [value, setValue] = useState(rate ? String(rate.rate) : "");
  const [error, setError] = useState<string | null>(null);
  const options = useMemo(() => allCountries().filter((c) => !taken.includes(c.code)), [taken]);
  const names = useMemo(() => new Intl.DisplayNames(["en"], { type: "region" }), []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = parseRate(value);
    if (!country) return setError(t("errors.country"));
    if (parsed === null) return setError(t("errors.rate"));
    try {
      await save({ countryCode: country, rate: parsed }).unwrap();
      toast.success(t("saved", { country: names.of(country) ?? country }));
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err) ?? t("failed"));
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{rate ? names.of(rate.countryCode) : t("add")}</DialogTitle>
            <DialogDescription>{t("dialogHint")}</DialogDescription>
          </DialogHeader>
          {!rate && (
            <FormField id={`${uid}-country`} label={t("columns.country")}>
              <NativeSelect id={`${uid}-country`} value={country} onChange={(event) => setCountry(event.target.value)}>
                <option value="">{t("chooseCountry")}</option>
                {options.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
          )}
          <FormField id={`${uid}-rate`} label={t("columns.rate")} hint={t("rateHint")}>
            <div className="relative">
              <Input
                id={`${uid}-rate`}
                inputMode="decimal"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="21"
                className="pr-7"
                autoFocus={!!rate}
              />
              <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-sm text-muted-foreground">
                %
              </span>
            </div>
          </FormField>
          {error && (
            <p role="alert" className="text-xs font-medium text-destructive">
              {error}
            </p>
          )}
          <DialogFooter className="sm:justify-between">
            {rate ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                disabled={removing.isLoading}
                onClick={async () => {
                  try {
                    await remove(rate.countryCode).unwrap();
                    toast.success(t("removed", { country: names.of(rate.countryCode) ?? rate.countryCode }));
                    onClose();
                  } catch (err) {
                    setError(apiErrorMessage(err) ?? t("failed"));
                  }
                }}
              >
                <Trash2Icon />
                {t("useDefault")}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={onClose}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={saving.isLoading}>
                {t("save")}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
