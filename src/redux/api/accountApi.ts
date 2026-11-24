import type { Address, AddressInput, User } from "@/types/auth";
import type { Order, OrderSummary, PageMeta } from "@/types/checkout";
import { baseApi } from "./baseApi";
import { checkoutApi } from "./checkoutApi";

interface Envelope<T> {
  data: T;
}

/** The signed-in customer's profile, address book and order history. */
export const accountApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    updateProfile: build.mutation<User, { firstName?: string; lastName?: string; phone?: string | null }>({
      query: (body) => ({ url: "/account/profile", method: "PATCH", body }),
      transformResponse: (response: Envelope<User>) => response.data,
      invalidatesTags: ["User"],
    }),
    getAddresses: build.query<Address[], void>({
      query: () => "/account/addresses",
      transformResponse: (response: Envelope<Address[]>) => response.data,
      providesTags: ["Address"],
    }),
    createAddress: build.mutation<Address, AddressInput>({
      query: (body) => ({ url: "/account/addresses", method: "POST", body }),
      transformResponse: (response: Envelope<Address>) => response.data,
      invalidatesTags: ["Address"],
    }),
    updateAddress: build.mutation<Address, { id: string } & Partial<AddressInput>>({
      query: ({ id, ...body }) => ({ url: `/account/addresses/${id}`, method: "PATCH", body }),
      transformResponse: (response: Envelope<Address>) => response.data,
      invalidatesTags: ["Address"],
    }),
    deleteAddress: build.mutation<void, string>({
      query: (id) => ({ url: `/account/addresses/${id}`, method: "DELETE" }),
      invalidatesTags: ["Address"],
    }),
    getMyOrders: build.query<{ orders: OrderSummary[]; meta: PageMeta }, { page: number }>({
      query: ({ page }) => ({ url: "/account/orders", params: { page } }),
      transformResponse: (response: Envelope<OrderSummary[]> & { meta: PageMeta }) => ({
        orders: response.data,
        meta: response.meta,
      }),
      providesTags: ["Order"],
    }),
    /** Asks to return a shipped order; answers with the order, which the order page shows at once. */
    requestReturn: build.mutation<Order, string>({
      query: (id) => ({ url: `/account/orders/${id}/return`, method: "POST" }),
      transformResponse: (response: Envelope<Order>) => response.data,
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(checkoutApi.util.updateQueryData("getOrder", id, () => data));
        } catch {
          // The caller shows the error; the order stays as it was.
        }
      },
    }),
  }),
});

// Browser-only, like the other per-visitor queries (see useIsClient).
export const {
  useUpdateProfileMutation,
  useGetAddressesQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useGetMyOrdersQuery,
  useRequestReturnMutation,
} = accountApi;
