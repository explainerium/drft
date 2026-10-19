"use client";

import { useLocale, useTranslations } from "next-intl";
import { useFormContext, useFormState, useWatch } from "react-hook-form";
import { DIAL_CODES, flagEmoji } from "@/constants/countries";
import type { CheckoutFormValues } from "./checkoutForm";
import { describedBy, Field, SelectInput, TextInput } from "@/components/form/fields";

type Prefix = "shipping" | "billing";
type AddressKey = "countryCode" | "firstName" | "lastName" | "company" | "street1" | "street2" | "postcode" | "city";

/** Country, name, street, postcode and city (plus the courier phone for shipping). */
export function AddressFields({ prefix, countries }: { prefix: Prefix; countries: string[] }) {
  const t = useTranslations("checkout.address");
  const locale = useLocale();
  const { register, control } = useFormContext<CheckoutFormValues>();
  const { errors } = useFormState({ control, name: prefix });
  const regionName = new Intl.DisplayNames([locale], { type: "region" });
  const countryCode = useWatch({ control, name: `${prefix}.countryCode` });
  const fieldErrors = errors[prefix] as Partial<Record<AddressKey | "phone", { message?: string }>> | undefined;

  const field = (name: AddressKey, label: string, autoComplete: string, className?: string) => {
    const id = `${prefix}-${name}`;
    const error = fieldErrors?.[name]?.message;
    return (
      <Field id={id} label={label} error={error} className={className}>
        <TextInput
          id={id}
          autoComplete={`${prefix === "billing" ? "billing" : "shipping"} ${autoComplete}`}
          {...describedBy(id, error)}
          {...register(`${prefix}.${name}`)}
        />
      </Field>
    );
  };

  const countryId = `${prefix}-countryCode`;
  const countryError = fieldErrors?.countryCode?.message;
  const phoneId = `${prefix}-phone`;
  const phoneError = fieldErrors?.phone?.message;
  const dial = DIAL_CODES[countryCode ?? ""];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
      <Field id={countryId} label={t("country")} error={countryError} className="sm:col-span-6">
        <SelectInput
          id={countryId}
          autoComplete={`${prefix === "billing" ? "billing" : "shipping"} country`}
          {...describedBy(countryId, countryError)}
          {...register(`${prefix}.countryCode`)}
        >
          <option value="">{t("countryPlaceholder")}</option>
          {countries.map((code) => (
            <option key={code} value={code}>
              {regionName.of(code) ?? code}
            </option>
          ))}
        </SelectInput>
      </Field>
      {field("firstName", t("firstName"), "given-name", "sm:col-span-3")}
      {field("lastName", t("lastName"), "family-name", "sm:col-span-3")}
      {field("company", t("company"), "organization", "sm:col-span-6")}
      {field("street1", t("street1"), "address-line1", "sm:col-span-6")}
      {field("street2", t("street2"), "address-line2", "sm:col-span-6")}
      {field("postcode", t("postcode"), "postal-code", "sm:col-span-2")}
      {field("city", t("city"), "address-level2", "sm:col-span-4")}
      {prefix === "shipping" && (
        <Field id={phoneId} label={t("phone")} hint={t("phoneHint")} error={phoneError} className="sm:col-span-6">
          <div className="flex gap-2">
            {dial && countryCode && (
              <span
                aria-hidden
                className="flex h-12 shrink-0 items-center gap-1.5 rounded-sm bg-secondary px-3 text-sm font-medium"
              >
                <span>{flagEmoji(countryCode)}</span>
                {dial}
              </span>
            )}
            <TextInput
              id={phoneId}
              type="tel"
              autoComplete="shipping tel-national"
              {...describedBy(phoneId, phoneError)}
              {...register("shipping.phone")}
            />
          </div>
        </Field>
      )}
    </div>
  );
}
