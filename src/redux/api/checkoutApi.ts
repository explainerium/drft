import type { CheckoutQuote, Order, PlacedOrder, PlaceOrderInput } from "@/types/checkout";
import { baseApi } from "./baseApi";

interface Envelope<T> {
  data: T;
}

/**
 * Checkout works on the visitor's server cart. The quote is recalculated by
 * the backend for each country and shipping method; the order total is
 * always the backend's, never the browser's.
 */
export const checkoutApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getCheckout: build.query<CheckoutQuote, { country?: string; shippingRateId?: string }>({
      query: (params) => ({ url: "/checkout", params }),
      transformResponse: (response: Envelope<CheckoutQuote>) => response.data,
      providesTags: ["Cart"],
    }),
    placeOrder: build.mutation<PlacedOrder, PlaceOrderInput>({
      query: (body) => ({ url: "/checkout/orders", method: "POST", body }),
      transformResponse: (response: Envelope<PlacedOrder>) => response.data,
      // Stock changed, so the cart's limits are re-read; the order (and maybe an address) is new.
      invalidatesTags: ["Cart", "Order", "Address"],
    }),
    /** ISO codes the store ships to, for address forms outside checkout. */
    getCountries: build.query<string[], void>({
      query: () => "/checkout/countries",
      transformResponse: (response: Envelope<string[]>) => response.data,
    }),
    getOrder: build.query<Order, string>({
      query: (id) => `/orders/${id}`,
      transformResponse: (response: Envelope<Order>) => response.data,
      providesTags: (_result, _error, id) => [{ type: "Order", id }],
    }),
  }),
});

// Like useCart: only in components that render in the browser (see useIsClient).
export const { useGetCheckoutQuery, usePlaceOrderMutation, useGetCountriesQuery, useGetOrderQuery } = checkoutApi;
