"use client";

import { ImageIcon, ImagePlusIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { revalidateTags } from "@/redux/api/adminCatalogApi";
import { useSaveSettingsMutation, useSettingsGroup } from "@/redux/api/adminSettingsApi";
import type { SettingGroup, SettingGroups } from "@/types/adminSettings";
import { apiErrorMessage, apiFieldErrors } from "@/utils/apiError";
import { PageHeader, QueryError } from "../AdminPage";
import { MediaPicker, thumbOf } from "../products/MediaPicker";
import { Checkbox, FormField } from "../products/fields";

/** Store-wide settings, one panel per settings group, each saved on its own. */
export function SettingsView() {
  const t = useTranslations("admin.settings");
  return (
    <>
      <PageHeader title={t("title")} description={t("subtitle")} />
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 xl:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-5">
          <GroupPanel group="store">{(value) => <StoreForm value={value} />}</GroupPanel>
          <GroupPanel group="seo">{(value) => <SeoForm value={value} />}</GroupPanel>
        </div>
        <div className="flex min-w-0 flex-col gap-5">
          <CheckoutPanel />
          <GroupPanel group="inventory">{(value) => <InventoryForm value={value} />}</GroupPanel>
          <GroupPanel group="social">{(value) => <SocialForm value={value} />}</GroupPanel>
        </div>
      </div>
    </>
  );
}

/** Loads one group and hands its value to the form (remounted on each save so it starts clean). */
function GroupPanel<G extends SettingGroup>({
  group,
  children,
}: {
  group: G;
  children: (value: SettingGroups[G]) => ReactNode;
}) {
  const t = useTranslations("admin.settings");
  const { data, isError, refetch, fulfilledTimeStamp } = useSettingsGroup(group);
  return (
    <section className="panel flex min-w-0 flex-col">
      <div className="flex flex-col gap-0.5 px-5 pt-5 pb-4">
        <h2 className="font-heading text-[15px] font-semibold">{t(`groups.${group as SettingGroup}.title`)}</h2>
        <p className="text-xs text-muted-foreground">{t(`groups.${group as SettingGroup}.hint`)}</p>
      </div>
      <div className="px-5 pb-5">
        {isError ? (
          <QueryError onRetry={refetch} />
        ) : !data ? (
          <Skeleton className="h-32 w-full rounded-lg" />
        ) : (
          <div key={fulfilledTimeStamp}>{children(data)}</div>
        )}
      </div>
    </section>
  );
}

/** Save button plus the shared submit: field errors under fields, anything else as a toast. */
function useGroupSave<G extends SettingGroup>(group: G) {
  const t = useTranslations("admin.settings");
  const [save, state] = useSaveSettingsMutation();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submit = async (body: object) => {
    setErrors({});
    try {
      await save({ group, body }).unwrap();
      // Store details, SEO and social links show on the storefront.
      await revalidateTags(["settings"]);
      toast.success(t("saved", { group: t(`groups.${group as SettingGroup}.title`) }));
    } catch (error) {
      const fields = apiFieldErrors(error);
      setErrors(Object.fromEntries(fields.map((f) => [f.path, f.message])));
      if (fields.length === 0) toast.error(apiErrorMessage(error) ?? t("failed"));
    }
  };
  return { submit, saving: state.isLoading, errors };
}

function SaveRow({ saving, dirty }: { saving: boolean; dirty: boolean }) {
  const t = useTranslations("admin.settings");
  return (
    <div className="flex justify-end border-t pt-4">
      <Button type="submit" disabled={saving || !dirty}>
        {saving ? t("saving") : t("save")}
      </Button>
    </div>
  );
}

/** Field state for a flat object of strings; `dirty` once anything differs from the start. */
function useFields<T extends Record<string, string>>(initial: T) {
  const [values, setValues] = useState(initial);
  const dirty = (Object.keys(initial) as (keyof T)[]).some((key) => values[key] !== initial[key]);
  const bind = (key: keyof T & string) => ({
    value: values[key],
    onChange: (event: { target: { value: string } }) => setValues((v) => ({ ...v, [key]: event.target.value })),
  });
  return { values, bind, dirty };
}

function StoreForm({ value }: { value: SettingGroups["store"] }) {
  const t = useTranslations("admin.settings.fields");
  const uid = useId();
  const { submit, saving, errors } = useGroupSave("store");
  const { values, bind, dirty } = useFields({
    name: value.name,
    email: value.email,
    phone: value.phone,
    address: value.address,
  });
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submit(values);
  };
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormField id={`${uid}-name`} label={t("storeName")} error={errors.name}>
        <Input id={`${uid}-name`} maxLength={120} {...bind("name")} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id={`${uid}-email`} label={t("email")} hint={t("emailHint")} error={errors.email}>
          <Input id={`${uid}-email`} type="email" {...bind("email")} />
        </FormField>
        <FormField id={`${uid}-phone`} label={t("phone")} error={errors.phone}>
          <Input id={`${uid}-phone`} type="tel" maxLength={40} {...bind("phone")} />
        </FormField>
      </div>
      <FormField id={`${uid}-address`} label={t("address")} hint={t("addressHint")} error={errors.address}>
        <Textarea id={`${uid}-address`} rows={3} maxLength={500} {...bind("address")} />
      </FormField>
      <p className="text-xs text-muted-foreground">{t("currency")}</p>
      <SaveRow saving={saving} dirty={dirty} />
    </form>
  );
}

/** Free shipping threshold (group "shipping"); the default VAT rate lives on the VAT page. */
function CheckoutPanel() {
  return <GroupPanel group="shipping">{(value) => <ShippingForm value={value} />}</GroupPanel>;
}

function ShippingForm({ value }: { value: SettingGroups["shipping"] }) {
  const t = useTranslations("admin.settings.fields");
  const uid = useId();
  const { submit, saving, errors } = useGroupSave("shipping");
  const [enabled, setEnabled] = useState(value.freeShippingThreshold !== null);
  const { values, bind, dirty } = useFields({ threshold: value.freeShippingThreshold ?? "150.00" });
  const changed = dirty || enabled !== (value.freeShippingThreshold !== null);
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submit({ freeShippingThreshold: enabled ? values.threshold.trim() : null });
  };
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Checkbox label={t("freeShipping")} checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
      <FormField
        id={`${uid}-threshold`}
        label={t("threshold")}
        hint={t("thresholdHint")}
        error={errors.freeShippingThreshold}
      >
        <div className="relative max-w-40">
          <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground">
            €
          </span>
          <Input id={`${uid}-threshold`} inputMode="decimal" disabled={!enabled} className="pl-6" {...bind("threshold")} />
        </div>
      </FormField>
      <SaveRow saving={saving} dirty={changed} />
    </form>
  );
}

function InventoryForm({ value }: { value: SettingGroups["inventory"] }) {
  const t = useTranslations("admin.settings.fields");
  const uid = useId();
  const { submit, saving, errors } = useGroupSave("inventory");
  const { values, bind, dirty } = useFields({ lowStock: String(value.lowStockThreshold) });
  const valid = /^\d{1,4}$/.test(values.lowStock.trim());
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (valid) void submit({ lowStockThreshold: Number(values.lowStock) });
  };
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormField
        id={`${uid}-low`}
        label={t("lowStock")}
        hint={t("lowStockHint")}
        error={errors.lowStockThreshold ?? (valid ? undefined : t("whole"))}
      >
        <Input id={`${uid}-low`} inputMode="numeric" className="max-w-28" {...bind("lowStock")} />
      </FormField>
      <SaveRow saving={saving} dirty={dirty && valid} />
    </form>
  );
}

function SeoForm({ value }: { value: SettingGroups["seo"] }) {
  const t = useTranslations("admin.settings.fields");
  const uid = useId();
  const { submit, saving, errors } = useGroupSave("seo");
  const { values, bind, dirty } = useFields({
    defaultTitle: value.defaultTitle,
    titleTemplate: value.titleTemplate,
    defaultDescription: value.defaultDescription,
    enTitle: value.translations?.en?.defaultTitle ?? "",
    enDescription: value.translations?.en?.defaultDescription ?? "",
  });
  const [image, setImage] = useState<{ id: string; url: string | null } | null>(
    value.ogImageAssetId ? { id: value.ogImageAssetId, url: null } : null,
  );
  const [picking, setPicking] = useState(false);
  const imageChanged = (image?.id ?? null) !== value.ogImageAssetId;
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const { enTitle, enDescription, ...german } = values;
    const en = {
      ...(enTitle.trim() ? { defaultTitle: enTitle.trim() } : {}),
      ...(enDescription.trim() ? { defaultDescription: enDescription.trim() } : {}),
    };
    void submit({ ...german, ogImageAssetId: image?.id ?? null, translations: Object.keys(en).length ? { en } : {} });
  };
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormField id={`${uid}-title`} label={t("defaultTitle")} error={errors.defaultTitle}>
        <Input id={`${uid}-title`} maxLength={70} {...bind("defaultTitle")} />
      </FormField>
      <FormField id={`${uid}-template`} label={t("titleTemplate")} hint={t("titleTemplateHint")} error={errors.titleTemplate}>
        <Input id={`${uid}-template`} maxLength={100} {...bind("titleTemplate")} />
      </FormField>
      <FormField
        id={`${uid}-description`}
        label={t("defaultDescription")}
        hint={t("count", { count: values.defaultDescription.length })}
        error={errors.defaultDescription}
      >
        <Textarea id={`${uid}-description`} rows={3} maxLength={300} {...bind("defaultDescription")} />
      </FormField>
      <fieldset className="flex flex-col gap-4 rounded-lg border px-3 pt-2 pb-3">
        <legend className="px-1 text-sm font-medium">{t("english")}</legend>
        <p className="text-xs text-muted-foreground">{t("englishHint")}</p>
        <FormField id={`${uid}-en-title`} label={t("defaultTitle")}>
          <Input id={`${uid}-en-title`} maxLength={70} {...bind("enTitle")} />
        </FormField>
        <FormField id={`${uid}-en-description`} label={t("defaultDescription")}>
          <Textarea id={`${uid}-en-description`} rows={2} maxLength={300} {...bind("enDescription")} />
        </FormField>
      </fieldset>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t("shareImage")}</span>
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
            {image?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image.url} alt="" className="size-full object-cover" />
            ) : (
              <ImageIcon className="size-5 text-muted-foreground" aria-hidden />
            )}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setPicking(true)}>
            <ImagePlusIcon />
            {image ? t("changeImage") : t("chooseImage")}
          </Button>
          {image && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setImage(null)}>
              <XIcon />
              {t("removeImage")}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {image && !image.url ? t("shareImageSet") : t("shareImageHint")}
        </p>
      </div>
      <SaveRow saving={saving} dirty={dirty || imageChanged} />
      <MediaPicker
        single
        open={picking}
        onClose={() => setPicking(false)}
        exclude={image ? [image.id] : []}
        onPick={([asset]) => asset && setImage({ id: asset.id, url: thumbOf(asset) })}
      />
    </form>
  );
}

const SOCIAL = ["instagram", "youtube", "facebook", "tiktok"] as const;

function SocialForm({ value }: { value: SettingGroups["social"] }) {
  const t = useTranslations("admin.settings.fields");
  const uid = useId();
  const { submit, saving, errors } = useGroupSave("social");
  const { values, bind, dirty } = useFields({
    instagram: value.instagram ?? "",
    youtube: value.youtube ?? "",
    facebook: value.facebook ?? "",
    tiktok: value.tiktok ?? "",
  });
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    // Empty clears the link.
    void submit(Object.fromEntries(SOCIAL.map((key) => [key, values[key].trim() || null])));
  };
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {SOCIAL.map((key) => (
        <FormField key={key} id={`${uid}-${key}`} label={t(`social.${key}`)} error={errors[key]}>
          <Input id={`${uid}-${key}`} type="url" inputMode="url" placeholder="https://" {...bind(key)} />
        </FormField>
      ))}
      <SaveRow saving={saving} dirty={dirty} />
    </form>
  );
}
