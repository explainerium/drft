import type { User } from "@/types/auth";
import { baseApi } from "./baseApi";

interface Envelope<T> {
  data: T;
}

/** Tags whose data belongs to whoever is signed in: the cart merges on sign-in, orders are per customer. */
const SESSION_TAGS = ["User", "Cart", "Order", "Address", "Wishlist", "Dashboard", "AdminOrder", "Customer", "AdminProduct", "Media", "Shipping", "Vat", "Setting", "Staff", "Subscriber", "Message"] as const;

/**
 * Session cookies are httpOnly and set by the backend; the browser never sees
 * a token. Signing in or out refetches everything that depends on the user.
 */
export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // /auth/session, not /auth/me: a visitor gets null instead of a 401 on every page.
    getMe: build.query<User | null, void>({
      query: () => "/auth/session",
      transformResponse: (response: Envelope<User | null>) => response.data,
      providesTags: ["User"],
    }),
    login: build.mutation<{ user: User }, { email: string; password: string }>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      transformResponse: (response: Envelope<{ user: User }>) => response.data,
      invalidatesTags: [...SESSION_TAGS],
    }),
    register: build.mutation<
      { user: User },
      { email: string; password: string; firstName: string; lastName: string; website?: string }
    >({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
      transformResponse: (response: Envelope<{ user: User }>) => response.data,
      invalidatesTags: [...SESSION_TAGS],
    }),
    logout: build.mutation<void, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      invalidatesTags: [...SESSION_TAGS],
    }),
    forgotPassword: build.mutation<void, { email: string }>({
      query: (body) => ({ url: "/auth/forgot-password", method: "POST", body }),
    }),
    resetPassword: build.mutation<void, { token: string; password: string }>({
      query: (body) => ({ url: "/auth/reset-password", method: "POST", body }),
      invalidatesTags: [...SESSION_TAGS],
    }),
    verifyEmail: build.mutation<void, { token: string }>({
      query: (body) => ({ url: "/auth/verify-email", method: "POST", body }),
      invalidatesTags: ["User"],
    }),
    resendVerification: build.mutation<void, void>({
      query: () => ({ url: "/auth/resend-verification", method: "POST" }),
    }),
    changePassword: build.mutation<void, { currentPassword: string; newPassword: string }>({
      query: (body) => ({ url: "/auth/change-password", method: "PATCH", body }),
      invalidatesTags: [...SESSION_TAGS],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
  useChangePasswordMutation,
} = authApi;

/**
 * The signed-in user, or null for a visitor. Browser-only like useCart (see
 * useIsClient). A visitor gets null; an expired session is refreshed once by
 * the base query, and a failed refresh also ends signed out.
 */
export function useSession(): { user: User | null; isLoading: boolean } {
  const { data, isLoading, isError } = authApi.useGetMeQuery();
  return { user: isError ? null : (data ?? null), isLoading };
}
