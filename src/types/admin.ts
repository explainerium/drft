import type { Address, User } from "./auth";
import type { Order, OrderStatus, PaymentProvider } from "./checkout";

/** Shapes returned by the staff endpoints. Money is a "1480.00" string. */

export interface Metric<T = number> {
  current: T;
  previous: T;
  /** Percent against the previous period; null when the previous period was zero. */
  change: number | null;
}

export interface AdminOrderRow {
  id: string;
  number: string;
  status: OrderStatus;
  customer: { name: string; email: string; isRegistered: boolean };
  country: string | null;
  itemCount: number;
  /** The first line's product name. */
  firstProduct: string | null;
  total: string;
  currency: string;
  paymentProvider: PaymentProvider | null;
  createdAt: string;
}

export interface DashboardSummary {
  period: { days: number; from: string; to: string };
  revenue: Metric<string>;
  orders: Metric;
  averageOrderValue: Metric<string>;
  newCustomers: Metric;
  series: { date: string; revenue: string; orders: number }[];
  /** Where the orders placed in the period stand now. */
  fulfilment: {
    total: number;
    delivered: number;
    shipped: number;
    toShip: number;
    awaitingPayment: number;
    cancelled: number;
    /** Paid orders that have shipped, 0–100; null without paid orders. */
    shippedPercent: number | null;
  };
  toFulfil: number;
  awaitingPayment: number;
  recentOrders: AdminOrderRow[];
  lowStock: {
    threshold: number;
    items: {
      variantId: string;
      productId: string;
      productName: string;
      /** "14m² / Lagoon Teal", empty for a single-variant product. */
      options: string;
      sku: string | null;
      stock: number;
      allowBackorder: boolean;
    }[];
  };
  topProducts: { productId: string | null; productName: string; units: number; revenue: string }[];
}

export type DashboardRange = 7 | 30 | 90;

export interface AdminOrder extends Order {
  marketingOptIn: boolean;
  cancelledAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  tracking: { carrier: string | null; number: string; url: string | null } | null;
  customer: {
    name: string;
    email: string;
    account: { id: string; name: string | null; orderCount: number } | null;
  };
  history: { id: string; status: OrderStatus; note: string | null; createdAt: string; by: string | null }[];
  notes: { id: string; body: string; createdAt: string; by: string | null }[];
  /** The status changes staff may make now. */
  nextStatuses: OrderStatus[];
}

export interface OrderListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus;
  userId?: string;
}

export interface TrackingInput {
  trackingCarrier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
}

export interface StatusChangeInput extends TrackingInput {
  status: OrderStatus;
  note?: string | null;
  notifyCustomer: boolean;
}

export interface CustomerRow extends User {
  lastLoginAt: string | null;
  orderCount: number;
}

export interface Customer extends User {
  lastLoginAt: string | null;
  addresses: Address[];
  paidOrders: number;
  totalSpent: string;
}

export interface CustomerListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: User["status"];
}
