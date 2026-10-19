import { z } from "zod";
import { DEFAULT_COUNTRY, DIAL_CODES } from "@/constants/countries";
import type { PaymentProvider, PlaceOrderInput, PostalAddress } from "@/types/checkout";

/** Error texts, translated by the caller (keys of `checkout.errors`). */
export interface FormMessages {
  required: string;
  email: string;
  phone: string;
  country: string;
}

const addressFields = (m: FormMessages) => ({
  firstName: z.string().trim().min(1, m.required).max(100),
  lastName: z.string().trim().min(1, m.required).max(100),
  company: z.string().trim().max(120),
  street1: z.string().trim().min(1, m.required).max(200),
  street2: z.string().trim().max(200),
  postcode: z.string().trim().min(1, m.required).max(20),
  city: z.string().trim().min(1, m.required).max(100),
  countryCode: z.string().length(2, m.country),
});

/** The same limits the backend checks; the backend has the final word. */
export const checkoutSchema = (m: FormMessages) =>
  z
    .object({
      email: z.email(m.email).max(254),
      marketingOptIn: z.boolean(),
      shipping: z.object({ ...addressFields(m), phone: z.string().trim().min(5, m.phone).max(30) }),
      billingSame: z.boolean(),
      // Any text here; the address rules apply only when billing differs (below).
      billing: z.record(z.string(), z.string()),
      shippingRateId: z.string(),
      paymentProvider: z.string(),
      saveAddress: z.boolean(),
    })
    .superRefine((values, ctx) => {
      if (values.billingSame) return;
      const result = z.object(addressFields(m)).safeParse(values.billing);
      for (const issue of result.error?.issues ?? []) {
        ctx.addIssue({ code: "custom", message: issue.message, path: ["billing", ...issue.path] });
      }
    });

export type CheckoutFormValues = z.infer<ReturnType<typeof checkoutSchema>>;

const emptyAddress = { firstName: "", lastName: "", company: "", street1: "", street2: "", postcode: "", city: "" };

export const defaultCheckoutValues: CheckoutFormValues = {
  email: "",
  marketingOptIn: false,
  shipping: { ...emptyAddress, countryCode: DEFAULT_COUNTRY, phone: "" },
  billingSame: true,
  billing: { ...emptyAddress, countryCode: DEFAULT_COUNTRY },
  shippingRateId: "",
  paymentProvider: "",
  saveAddress: false,
};

const blankToNull = (value: string | undefined) => (value?.trim() ? value.trim() : null);

const toAddress = (a: Partial<Record<keyof typeof emptyAddress | "countryCode", string>>): PostalAddress => ({
  firstName: a.firstName ?? "",
  lastName: a.lastName ?? "",
  company: blankToNull(a.company),
  street1: a.street1 ?? "",
  street2: blankToNull(a.street2),
  postcode: a.postcode ?? "",
  city: a.city ?? "",
  countryCode: a.countryCode ?? "",
});

/**
 * "06 4829 1042" in NL → "+31 6 4829 1042"; a number typed with its own + code
 * is kept. The national trunk 0 is dropped, except in Italy where it is part of
 * the number.
 */
export const fullPhone = (phone: string, countryCode: string) => {
  const trimmed = phone.trim();
  const dial = DIAL_CODES[countryCode];
  if (trimmed.startsWith("+") || !dial) return trimmed;
  return `${dial} ${countryCode === "IT" ? trimmed : trimmed.replace(/^0+/, "")}`;
};

export const toPlaceOrderInput = (
  values: CheckoutFormValues,
  shippingRateId: string,
  paymentProvider: PaymentProvider | null,
): PlaceOrderInput => ({
  email: values.email.trim(),
  marketingOptIn: values.marketingOptIn,
  shippingAddress: {
    ...toAddress(values.shipping),
    phone: fullPhone(values.shipping.phone, values.shipping.countryCode),
  },
  billingAddress: values.billingSame ? null : toAddress(values.billing),
  shippingRateId,
  paymentProvider,
  saveAddress: values.saveAddress,
});

/** Backend field paths ("shippingAddress.city") → form paths ("shipping.city"). */
export const formPath = (apiPath: string) =>
  apiPath.replace(/^shippingAddress\b/, "shipping").replace(/^billingAddress\b/, "billing");
