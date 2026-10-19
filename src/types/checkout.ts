import type { CartLine } from "./cart";

/** Shapes returned by `/api/v1/checkout` and `/api/v1/orders`. Money is a "1480.00" string. */

export type PaymentProvider = "STRIPE" | "PAYPAL";

export interface ShippingRateOption {
  id: string;
  name: string;
  description: string | null;
  /** What this cart pays: "0.00" when the free shipping offer applies. */
  price: string;
  regularPrice: string;
  isFree: boolean;
}

export interface CheckoutQuote {
  /** ISO codes the store ships to. */
  countries: string[];
  /** The requested country when the store ships there, else null. */
  country: string | null;
  items: CartLine[];
  /** Empty cart, or a line that can no longer be bought. */
  blocked: boolean;
  itemCount: number;
  freeShipping: { threshold: string | null; remaining: string | null; qualified: boolean };
  rates: ShippingRateOption[];
  shippingRateId: string | null;
  totals: {
    subtotal: string;
    /** Null until a country with shipping rates is chosen. */
    shipping: string | null;
    vat: { rate: number; amount: string };
    total: string;
  };
  paymentProviders: PaymentProvider[];
}

export interface PostalAddress {
  firstName: string;
  lastName: string;
  company?: string | null;
  street1: string;
  street2?: string | null;
  postcode: string;
  city: string;
  region?: string | null;
  countryCode: string;
  phone?: string | null;
}

export interface PlaceOrderInput {
  email: string;
  marketingOptIn: boolean;
  shippingAddress: PostalAddress & { phone: string };
  billingAddress: PostalAddress | null;
  shippingRateId: string;
  paymentProvider: PaymentProvider | null;
  saveAddress: boolean;
}

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export interface OrderItem {
  id: string;
  productName: string;
  productSlug: string;
  typeLabel: string | null;
  sku: string | null;
  options: { name: string; value: string }[];
  imageUrl: string | null;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
}

export interface Order {
  id: string;
  /** "DRFT-10001" */
  number: string;
  status: OrderStatus;
  email: string;
  phone: string | null;
  shippingAddress: PostalAddress;
  billingAddress: PostalAddress;
  shippingMethod: string;
  currency: string;
  items: OrderItem[];
  totals: { subtotal: string; shipping: string; vat: { rate: number; amount: string }; total: string };
  paymentProvider: PaymentProvider | null;
  reservedUntil: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface PlacedOrder {
  order: Order;
  /** What the browser needs to pay; null until a payment provider is connected. */
  payment: null;
}

/** A row of the customer's order history (`/api/v1/account/orders`). */
export interface OrderSummary {
  id: string;
  number: string;
  status: OrderStatus;
  total: string;
  currency: string;
  createdAt: string;
  itemCount: number;
  /** The first few lines, for thumbnails. */
  items: { productName: string; quantity: number; imageUrl: string | null }[];
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
