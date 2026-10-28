"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRightIcon,
  ChevronRightIcon,
  LockIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  ShieldIcon,
  ShoppingBagIcon,
  WavesIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import {
  FormProvider,
  useForm,
  useFormContext,
  useFormState,
  useWatch,
  type Path,
  type UseFormReturn,
} from "react-hook-form";
import { toast } from "sonner";
import { CheckboxRow, describedBy, Field, RadioCard, TextInput } from "@/components/form/fields";
import { DIAL_CODES } from "@/constants/countries";
import { ACCOUNT_LINKS } from "@/constants/navigation";
import { useIsClient } from "@/hooks/useIsClient";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useGetAddressesQuery } from "@/redux/api/accountApi";
import { useSession } from "@/redux/api/authApi";
import { useGetCheckoutQuery, usePlaceOrderMutation } from "@/redux/api/checkoutApi";
import type { Address, User } from "@/types/auth";
import type { CheckoutQuote, PaymentProvider } from "@/types/checkout";
import { apiErrorMessage, apiFieldErrors } from "@/utils/apiError";
import { formatPrice } from "@/utils/format";
import { AddressFields } from "./AddressFields";
import {
  checkoutSchema,
  defaultCheckoutValues,
  formPath,
  toPlaceOrderInput,
  type CheckoutFormValues,
} from "./checkoutForm";
import { CheckoutSection } from "./CheckoutSection";
import { CheckoutSummary } from "./CheckoutSummary";

const TRUST = [
  { key: "trial", Icon: WavesIcon },
  { key: "warranty", Icon: ShieldCheckIcon },
  { key: "returns", Icon: RotateCcwIcon },
] as const;

/** The checkout page body. Renders in the browser only: it works on the visitor's cart. */
export function CheckoutView() {
  if (!useIsClient()) return <CheckoutSkeleton />;
  return <LiveCheckout />;
}

/**
 * A signed-in customer starts with their email, name and default shipping
 * address filled in. Runs once, and never over anything already typed.
 */
function usePrefillFromAccount(
  form: UseFormReturn<CheckoutFormValues>,
  user: User | null,
  addresses: Address[] | undefined,
) {
  const done = useRef(false);

  useEffect(() => {
    if (!user || addresses === undefined || done.current) return;
    done.current = true;
    const { getValues, setValue } = form;

    if (!getValues("email")) setValue("email", user.email);
    if (getValues("shipping.firstName") || getValues("shipping.street1")) return;

    const saved = addresses.find((a) => a.isDefaultShipping) ?? addresses[0];
    const phone = saved?.phone ?? user.phone ?? "";
    const countryCode = saved?.countryCode ?? getValues("shipping.countryCode");
    const dial = DIAL_CODES[countryCode];
    setValue("shipping", {
      firstName: saved?.firstName ?? user.firstName,
      lastName: saved?.lastName ?? user.lastName,
      company: saved?.company ?? "",
      street1: saved?.street1 ?? "",
      street2: saved?.street2 ?? "",
      postcode: saved?.postcode ?? "",
      city: saved?.city ?? "",
      countryCode,
      // The field holds the national part; the country code is shown beside it.
      phone: dial && phone.startsWith(dial) ? phone.slice(dial.length).trim() : phone,
    });
  }, [user, addresses, form]);
}

function CheckoutSkeleton() {
  return (
    <div aria-hidden className="grid gap-10 lg:grid-cols-[minmax(0,655fr)_minmax(0,457fr)]">
      <div className="flex flex-col gap-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-md bg-card" />
        ))}
      </div>
      <div className="h-[480px] animate-pulse rounded-md bg-card" />
    </div>
  );
}

function LiveCheckout() {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const router = useRouter();

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(
      checkoutSchema({
        required: t("errors.required"),
        email: t("errors.email"),
        phone: t("errors.phone"),
        country: t("errors.country"),
      }),
    ),
    defaultValues: defaultCheckoutValues,
    mode: "onTouched",
  });
  const { control, register, handleSubmit, setError } = form;
  const country = useWatch({ control, name: "shipping.countryCode" });
  const rateChoice = useWatch({ control, name: "shippingRateId" });
  const paymentChoice = useWatch({ control, name: "paymentProvider" });
  const { errors } = useFormState({ control });

  // The backend prices the cart for this country and method; `data` stays on screen while it recalculates.
  const {
    data: quote,
    isFetching,
    isError,
    refetch,
  } = useGetCheckoutQuery({ country: country || undefined, shippingRateId: rateChoice || undefined });
  const [placeOrder, placing] = usePlaceOrderMutation();
  const { user } = useSession();
  const { data: addresses } = useGetAddressesQuery(undefined, { skip: !user });
  usePrefillFromAccount(form, user, addresses);

  if (!quote) {
    return isError ? (
      <div className="flex flex-col items-center gap-4 rounded-md bg-card py-16 text-center shadow-xs">
        <p className="text-sm text-muted-foreground">{t("error")}</p>
        <button type="button" onClick={() => refetch()} className="text-sm font-medium underline">
          {t("retry")}
        </button>
      </div>
    ) : (
      <CheckoutSkeleton />
    );
  }

  if (quote.items.length === 0) return <EmptyCheckout />;

  const provider = (choice: string): PaymentProvider | null =>
    quote.paymentProviders.find((p) => p === choice) ?? quote.paymentProviders[0] ?? null;

  const onSubmit = handleSubmit(async (values) => {
    if (!quote.country) {
      setError("shipping.countryCode", { message: t("errors.country") }, { shouldFocus: true });
      return;
    }
    if (!quote.shippingRateId) {
      toast.error(t("errors.shipping"));
      return;
    }
    try {
      const { order } = await placeOrder(
        toPlaceOrderInput(values, quote.shippingRateId, provider(values.paymentProvider)),
      ).unwrap();
      router.push(`/checkout/complete/${order.id}`);
    } catch (error) {
      for (const field of apiFieldErrors(error)) {
        setError(formPath(field.path) as Path<CheckoutFormValues>, { message: field.message });
      }
      toast.error(apiErrorMessage(error) ?? t("errors.failed"));
    }
  });

  const busy = placing.isLoading || placing.isSuccess;
  const canPlace = !quote.blocked && !!quote.country && !!quote.shippingRateId && !isFetching;

  return (
    <FormProvider {...form}>
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,655fr)_minmax(0,457fr)]">
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8 lg:gap-12">
          <CheckoutSection
            step={1}
            id="checkout-contact"
            title={t("contact.title")}
            aside={
              user ? (
                <span className="text-sm text-muted-foreground">{t("contact.signedIn", { email: user.email })}</span>
              ) : (
                <Link
                  href={`${ACCOUNT_LINKS.login}?next=/checkout`}
                  className="text-sm font-medium text-brand hover:underline"
                >
                  {t("contact.login")}
                </Link>
              )
            }
          >
            <Field id="email" label={t("contact.email")} error={errors.email?.message}>
              <TextInput
                id="email"
                type="email"
                autoComplete="email"
                {...describedBy("email", errors.email?.message)}
                {...register("email")}
              />
            </Field>
            <CheckboxRow label={t("contact.marketing")} {...register("marketingOptIn")} />
          </CheckoutSection>

          <CheckoutSection step={2} id="checkout-address" title={t("address.title")}>
            <AddressFields prefix="shipping" countries={quote.countries} />
            {user && <CheckboxRow label={t("address.save")} {...register("saveAddress")} />}
          </CheckoutSection>

          <CheckoutSection step={3} id="checkout-shipping" title={t("shipping.title")}>
            <ShippingMethods quote={quote} />
          </CheckoutSection>

          <CheckoutSection
            step={4}
            id="checkout-payment"
            title={t("payment.title")}
            aside={
              <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <ShieldIcon className="size-3.5" aria-hidden />
                {t("payment.compliance")}
              </span>
            }
          >
            <PaymentMethods providers={quote.paymentProviders} selected={provider(paymentChoice)} />
            <BillingAddress countries={quote.countries} />
          </CheckoutSection>

          <div className="flex flex-col gap-4">
            {quote.blocked && (
              <p className="rounded-sm bg-destructive/10 p-4 text-sm text-destructive">
                {t("blocked")}{" "}
                <Link href={ACCOUNT_LINKS.cart} className="font-medium underline">
                  {t("reviewCart")}
                </Link>
              </p>
            )}
            <button
              type="submit"
              disabled={!canPlace || busy}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-sm bg-primary px-6 text-sm font-semibold tracking-[0.05em] text-primary-foreground uppercase transition-colors hover:bg-primary/85 disabled:cursor-not-allowed disabled:bg-subtle-foreground"
            >
              {busy
                ? t("placing")
                : t("place", { total: formatPrice(quote.totals.total, locale, "EUR", { cents: true }) })}
              {!busy && <ArrowRightIcon className="size-4" aria-hidden />}
            </button>
            <ul className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-xs font-medium text-muted-foreground">
              {TRUST.map(({ key, Icon }) => (
                <li key={key} className="flex items-center gap-1.5">
                  <Icon className="size-3.5 text-brand" aria-hidden />
                  {t(`trust.${key}`)}
                </li>
              ))}
            </ul>
            <p className="text-center text-xs leading-5 font-medium text-subtle-foreground">
              {t.rich("legal", {
                terms: (chunks) => (
                  <Link href="/agb" className="underline">
                    {chunks}
                  </Link>
                ),
                privacy: (chunks) => (
                  <Link href="/datenschutz" className="underline">
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </div>
        </form>

        <CheckoutSummary quote={quote} updating={isFetching} />
      </div>
    </FormProvider>
  );
}

function ShippingMethods({ quote }: { quote: CheckoutQuote }) {
  const t = useTranslations("checkout.shipping");
  const locale = useLocale();
  const { register } = useFormContext<CheckoutFormValues>();

  if (!quote.country) {
    return <p className="rounded-sm bg-secondary p-4 text-sm text-muted-foreground">{t("chooseCountry")}</p>;
  }
  if (quote.rates.length === 0) {
    return <p className="rounded-sm bg-secondary p-4 text-sm text-muted-foreground">{t("none")}</p>;
  }

  return (
    <div role="radiogroup" aria-labelledby="checkout-shipping" className="flex flex-col gap-2">
      {quote.rates.map((rate) => (
        <RadioCard
          key={rate.id}
          value={rate.id}
          checked={rate.id === quote.shippingRateId}
          {...register("shippingRateId")}
        >
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
              {rate.name}
              {rate.isFree && (
                <span className="rounded-sm bg-brand-soft px-1.5 py-0.5 text-[11px] font-medium text-brand">
                  {t("included")}
                </span>
              )}
            </span>
            {rate.description && <span className="text-sm text-muted-foreground">{rate.description}</span>}
          </span>
          <span className={cn("shrink-0 text-sm font-medium", rate.isFree && "text-brand")}>
            {rate.isFree ? t("free") : formatPrice(rate.price, locale, "EUR", { cents: true })}
          </span>
        </RadioCard>
      ))}
    </div>
  );
}

function PaymentMethods({ providers, selected }: { providers: PaymentProvider[]; selected: PaymentProvider | null }) {
  const t = useTranslations("checkout.payment");
  const { register } = useFormContext<CheckoutFormValues>();

  if (providers.length === 0) {
    return (
      <p className="flex gap-2 rounded-sm bg-secondary p-4 text-sm leading-[22px] text-muted-foreground">
        <LockIcon className="mt-[3px] size-4 shrink-0" aria-hidden />
        {t("notConnected")}
      </p>
    );
  }

  return (
    <div role="radiogroup" aria-labelledby="checkout-payment" className="flex flex-col gap-2">
      {providers.map((p) => (
        <RadioCard key={p} value={p} checked={p === selected} {...register("paymentProvider")}>
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{t(p)}</span>
            <span className="text-xs font-medium text-muted-foreground">{t(`${p}Body`)}</span>
          </span>
        </RadioCard>
      ))}
    </div>
  );
}

function BillingAddress({ countries }: { countries: string[] }) {
  const t = useTranslations("checkout.payment");
  const { control, setValue } = useFormContext<CheckoutFormValues>();
  const same = useWatch({ control, name: "billingSame" });

  return (
    <fieldset className="flex flex-col gap-3 rounded-sm bg-surface p-4">
      <legend className="float-left mb-1 text-sm font-medium">{t("billing")}</legend>
      {[true, false].map((value) => (
        <label key={String(value)} className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="radio"
            name="billingSame"
            checked={same === value}
            onChange={() => setValue("billingSame", value, { shouldValidate: false })}
            className="size-4 accent-brand"
          />
          {value ? t("billingSame") : t("billingDifferent")}
        </label>
      ))}
      {!same && (
        <div className="mt-2">
          <AddressFields prefix="billing" countries={countries} />
        </div>
      )}
    </fieldset>
  );
}

function EmptyCheckout() {
  const t = useTranslations("checkout.empty");

  return (
    <div className="flex flex-col items-center gap-4 rounded-md bg-card px-5 py-16 text-center shadow-xs">
      <span className="flex size-14 items-center justify-center rounded-full bg-secondary" aria-hidden>
        <ShoppingBagIcon className="size-6 text-muted-foreground" />
      </span>
      <h2 className="font-heading text-2xl font-medium tracking-[-0.02em]">{t("title")}</h2>
      <p className="max-w-xs text-sm leading-[22px] text-muted-foreground">{t("body")}</p>
      <Link
        href="/shop"
        className="mt-2 inline-flex h-12 items-center gap-2 rounded-sm bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85"
      >
        {t("cta")}
        <ArrowRightIcon className="size-4" aria-hidden />
      </Link>
    </div>
  );
}

/** "Cart › Information › Shipping › Payment"; the cart step links back. */
export function CheckoutProgress() {
  const t = useTranslations("checkout.steps");
  const steps = ["information", "shipping", "payment"] as const;

  return (
    <nav aria-label={t("label")}>
      <ol className="flex flex-wrap items-center gap-2 text-sm font-medium text-muted-foreground">
        <li>
          <Link href={ACCOUNT_LINKS.cart} className="hover:text-foreground hover:underline">
            {t("cart")}
          </Link>
        </li>
        {steps.map((step, i) => (
          <li key={step} className="flex items-center gap-2">
            <ChevronRightIcon className="size-3.5" aria-hidden />
            <span className={cn(i === 0 && "text-foreground")} aria-current={i === 0 ? "step" : undefined}>
              {t(step)}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
