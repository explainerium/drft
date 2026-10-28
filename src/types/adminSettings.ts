import type { User } from "./auth";

/** Shapes of the admin-only setup endpoints (shipping, VAT, settings, staff). Money is a "9.90" string. */

export interface ShippingRate {
  id: string;
  name: string;
  description: string | null;
  price: string;
  /** Free once the cart reaches the store's free shipping threshold. */
  freeOverThreshold: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface ShippingZone {
  id: string;
  name: string;
  /** ISO codes, e.g. ["BE", "NL"]. */
  countries: string[];
  isActive: boolean;
  sortOrder: number;
  rates: ShippingRate[];
}

export interface ZoneInput {
  name: string;
  countries: string[];
  isActive: boolean;
  sortOrder: number;
}

export interface RateInput {
  name: string;
  description: string | null;
  price: string;
  freeOverThreshold: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface VatRate {
  countryCode: string;
  rate: number;
  updatedAt: string;
}

/** The settings groups the API knows, as it returns them. */
export interface SettingGroups {
  store: { name: string; email: string; phone: string; address: string; currency: "EUR" };
  seo: {
    defaultTitle: string;
    titleTemplate: string;
    defaultDescription: string;
    ogImageAssetId: string | null;
    /** The fields above are German; empty English ones fall back to them. */
    translations?: { en?: { defaultTitle?: string; defaultDescription?: string } };
  };
  social: { instagram?: string; youtube?: string; facebook?: string; tiktok?: string };
  shipping: { freeShippingThreshold: string | null };
  tax: { defaultVatRate: number };
  inventory: { lowStockThreshold: number };
}

export type SettingGroup = keyof SettingGroups;

export interface StaffMember extends User {
  lastLoginAt: string | null;
}

export interface StaffInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "STAFF" | "ADMIN";
}
