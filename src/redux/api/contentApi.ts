import { baseApi } from "./baseApi";

/** Storefront forms that write content: newsletter sign-up (double opt-in) and the contact form. */
export const contentApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    subscribe: build.mutation<void, { email: string; source: string }>({
      query: (body) => ({ url: "/newsletter", method: "POST", body }),
    }),
    confirmSubscription: build.mutation<void, { token: string }>({
      query: (body) => ({ url: "/newsletter/confirm", method: "POST", body }),
    }),
    unsubscribe: build.mutation<void, { token: string }>({
      query: (body) => ({ url: "/newsletter/unsubscribe", method: "POST", body }),
    }),
    sendContactMessage: build.mutation<
      void,
      { name: string; email: string; subject?: string; orderNumber?: string; message: string; website?: string }
    >({
      query: (body) => ({ url: "/contact", method: "POST", body }),
    }),
  }),
});

export const {
  useSubscribeMutation,
  useConfirmSubscriptionMutation,
  useUnsubscribeMutation,
  useSendContactMessageMutation,
} = contentApi;
