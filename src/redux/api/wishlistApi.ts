import type { WishlistItem } from "@/types/wishlist";
import { useSession } from "./authApi";
import { baseApi } from "./baseApi";

interface Envelope<T> {
  data: T;
}

const unwrap = (response: Envelope<WishlistItem[]>) => response.data;

/** Signed-in customers only. Every change answers with the whole list, which replaces the cached one. */
export const wishlistApi = baseApi.injectEndpoints({
  endpoints: (build) => {
    const replaceList = async (
      _arg: unknown,
      {
        dispatch,
        queryFulfilled,
      }: { dispatch: (action: unknown) => unknown; queryFulfilled: Promise<{ data: WishlistItem[] }> },
    ) => {
      try {
        const { data } = await queryFulfilled;
        dispatch(wishlistApi.util.updateQueryData("getWishlist", undefined, () => data));
      } catch {
        // The caller shows the error.
      }
    };

    return {
      getWishlist: build.query<WishlistItem[], void>({
        query: () => "/wishlist",
        transformResponse: unwrap,
        providesTags: ["Wishlist"],
      }),
      addToWishlist: build.mutation<WishlistItem[], { productId: string; variantId?: string | null }>({
        query: (body) => ({ url: "/wishlist", method: "POST", body }),
        transformResponse: unwrap,
        onQueryStarted: replaceList,
      }),
      removeFromWishlist: build.mutation<WishlistItem[], string>({
        query: (productId) => ({ url: `/wishlist/${productId}`, method: "DELETE" }),
        transformResponse: unwrap,
        onQueryStarted: replaceList,
      }),
    };
  },
});

export const { useAddToWishlistMutation, useRemoveFromWishlistMutation } = wishlistApi;

/**
 * The signed-in customer's wishlist (empty for visitors, without a request).
 * Browser-only, like useCart.
 */
export function useWishlist() {
  const { user, isLoading: sessionLoading } = useSession();
  const { data, isLoading, isError, refetch } = wishlistApi.useGetWishlistQuery(undefined, { skip: !user });
  const items = user ? (data ?? []) : [];
  return {
    user,
    items,
    isLoading: sessionLoading || (!!user && isLoading),
    isError: !!user && isError,
    refetch,
    has: (productId: string) => items.some((item) => item.product.id === productId),
  };
}
