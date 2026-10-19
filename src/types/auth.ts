/** The signed-in user, as `/api/v1/auth/me` returns it. */
export interface User {
  id: string;
  email: string;
  role: "CUSTOMER" | "STAFF" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED";
  firstName: string;
  lastName: string;
  phone: string | null;
  emailVerifiedAt: string | null;
  createdAt: string;
}

/** An entry in the customer's address book (`/api/v1/account/addresses`). */
export interface Address {
  id: string;
  firstName: string;
  lastName: string;
  company: string | null;
  street1: string;
  street2: string | null;
  postcode: string;
  city: string;
  region: string | null;
  countryCode: string;
  phone: string | null;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}

export type AddressInput = Omit<Address, "id">;
