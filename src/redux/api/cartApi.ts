import type { Cart } from "@/types/cart";
import { baseApi } from "./baseApi";

interface Envelope<T> {
  data: T;
}

const unwrap = (response: Envelope<Cart>) => response.data;

/**
 * The cart lives on the backend (guest cookie or the signed-in customer).
 * Every mutation answers with the whole cart, which replaces the cached one,
 * so there is no refetch after a change.
 */
export const cartApi = baseApi.injectEndpoints({
  endpoints: (build) => {
    const replaceCart = async (
      _arg: unknown,
      { dispatch, queryFulfilled }: { dispatch: (action: unknown) => unknown; queryFulfilled: Promise<{ data: Cart }> },
    ) => {
      try {
        const { data } = await queryFulfilled;
        // A plain cache write. upsertQueryData would drop it when the cart was
        // fetched after this mutation started.
        dispatch(cartApi.util.updateQueryData("getCart", undefined, () => data));
      } catch {
        // The caller shows the error; the cached cart stays as it was.
      }
    };

    return {
      getCart: build.query<Cart, void>({
        query: () => "/cart",
        transformResponse: unwrap,
        providesTags: ["Cart"],
      }),
      addCartItem: build.mutation<Cart, { variantId: string; quantity: number }>({
        query: (body) => ({ url: "/cart/items", method: "POST", body }),
        transformResponse: unwrap,
        onQueryStarted: replaceCart,
      }),
      updateCartItem: build.mutation<Cart, { itemId: string; quantity: number }>({
        query: ({ itemId, quantity }) => ({ url: `/cart/items/${itemId}`, method: "PATCH", body: { quantity } }),
        transformResponse: unwrap,
        onQueryStarted: replaceCart,
      }),
      removeCartItem: build.mutation<Cart, { itemId: string }>({
        query: ({ itemId }) => ({ url: `/cart/items/${itemId}`, method: "DELETE" }),
        transformResponse: unwrap,
        onQueryStarted: replaceCart,
      }),
    };
  },
});

// Read the cart with useCart() below, not the generated query hook.
export const { useAddCartItemMutation, useUpdateCartItemMutation, useRemoveCartItemMutation } = cartApi;

/**
 * The visitor's cart. Use it only in components that render in the browser
 * (see useIsClient): the cart belongs to the visitor's cookie, and RTK Query
 * reads the clock when a query hook renders, which Cache Components rejects
 * during a prerender.
 */
export const useCart = () => cartApi.useGetCartQuery();
