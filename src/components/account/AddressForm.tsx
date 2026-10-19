"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { CheckboxRow, describedBy, Field, SelectInput, SubmitButton, TextInput } from "@/components/form/fields";
import { DEFAULT_COUNTRY } from "@/constants/countries";
import { useCreateAddressMutation, useUpdateAddressMutation } from "@/redux/api/accountApi";
import { useGetCountriesQuery } from "@/redux/api/checkoutApi";
import type { Address } from "@/types/auth";
import { apiErrorMessage } from "@/utils/apiError";

type TextField = "firstName" | "lastName" | "company" | "street1" | "street2" | "postcode" | "city" | "phone";

const blankToNull = (value: string) => (value.trim() ? value.trim() : null);

/** Add or edit an address-book entry. */
export function AddressForm({ address, onDone }: { address?: Address; onDone: () => void }) {
  const t = useTranslations("account");
  const locale = useLocale();
  const regionName = new Intl.DisplayNames([locale], { type: "region" });
  const { data: countries } = useGetCountriesQuery();
  const [createAddress, creating] = useCreateAddressMutation();
  const [updateAddress, updating] = useUpdateAddressMutation();
  const busy = creating.isLoading || updating.isLoading;

  const required = z.string().trim().min(1, t("errors.required"));
  const schema = z.object({
    firstName: required.max(100),
    lastName: required.max(100),
    company: z.string().trim().max(120),
    street1: required.max(200),
    street2: z.string().trim().max(200),
    postcode: required.max(20),
    city: required.max(100),
    countryCode: z.string().length(2, t("errors.country")),
    phone: z.string().trim().max(40),
    isDefaultShipping: z.boolean(),
    isDefaultBilling: z.boolean(),
  });
  type Values = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: address?.firstName ?? "",
      lastName: address?.lastName ?? "",
      company: address?.company ?? "",
      street1: address?.street1 ?? "",
      street2: address?.street2 ?? "",
      postcode: address?.postcode ?? "",
      city: address?.city ?? "",
      countryCode: address?.countryCode ?? DEFAULT_COUNTRY,
      phone: address?.phone ?? "",
      isDefaultShipping: address?.isDefaultShipping ?? false,
      isDefaultBilling: address?.isDefaultBilling ?? false,
    },
    mode: "onTouched",
  });

  // A <select> keeps its default only if the option exists when it mounts.
  if (!countries) return <div aria-hidden className="h-96 animate-pulse rounded-sm bg-secondary" />;

  const onSubmit = handleSubmit(async (values) => {
    const body = {
      ...values,
      company: blankToNull(values.company),
      street2: blankToNull(values.street2),
      phone: blankToNull(values.phone),
      region: address?.region ?? null,
    };
    try {
      if (address) await updateAddress({ id: address.id, ...body }).unwrap();
      else await createAddress(body).unwrap();
      toast.success(t("addresses.saved"));
      onDone();
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? t("errors.failed"));
    }
  });

  const prefix = address ? `address-${address.id}` : "address-new";
  const text = (name: TextField, autoComplete: string, className = "sm:col-span-6") => {
    const id = `${prefix}-${name}`;
    return (
      <Field id={id} label={t(`address.${name}`)} error={errors[name]?.message} className={className}>
        <TextInput
          id={id}
          autoComplete={autoComplete}
          {...describedBy(id, errors[name]?.message)}
          {...register(name)}
        />
      </Field>
    );
  };

  // The saved country stays selectable even if the store stopped shipping there.
  const options = address && !countries.includes(address.countryCode) ? [...countries, address.countryCode] : countries;

  return (
    <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-6">
      <Field
        id={`${prefix}-country`}
        label={t("address.country")}
        error={errors.countryCode?.message}
        className="sm:col-span-6"
      >
        <SelectInput
          id={`${prefix}-country`}
          autoComplete="country"
          {...describedBy(`${prefix}-country`, errors.countryCode?.message)}
          {...register("countryCode")}
        >
          <option value="">{t("address.countryPlaceholder")}</option>
          {options.map((code) => (
            <option key={code} value={code}>
              {regionName.of(code) ?? code}
            </option>
          ))}
        </SelectInput>
      </Field>
      {text("firstName", "given-name", "sm:col-span-3")}
      {text("lastName", "family-name", "sm:col-span-3")}
      {text("company", "organization")}
      {text("street1", "address-line1")}
      {text("street2", "address-line2")}
      {text("postcode", "postal-code", "sm:col-span-2")}
      {text("city", "address-level2", "sm:col-span-4")}
      {text("phone", "tel")}
      <div className="flex flex-col gap-2 sm:col-span-6">
        <CheckboxRow label={t("addresses.makeDefaultShipping")} {...register("isDefaultShipping")} />
        <CheckboxRow label={t("addresses.makeDefaultBilling")} {...register("isDefaultBilling")} />
      </div>
      <div className="flex flex-wrap gap-3 sm:col-span-6">
        <SubmitButton disabled={busy} className="sm:w-auto">
          {busy ? t("addresses.saving") : t("addresses.save")}
        </SubmitButton>
        <button
          type="button"
          onClick={onDone}
          className="h-12 rounded-sm px-6 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          {t("addresses.cancel")}
        </button>
      </div>
    </form>
  );
}
