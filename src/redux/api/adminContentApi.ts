import type { CatalogImage } from "@/types/catalog";
import type { PageMeta } from "@/types/checkout";
import { baseApi } from "./baseApi";

/** Shapes of the staff content endpoints. Bodies are sanitized HTML. */

export type ContentStatus = "DRAFT" | "PUBLISHED";

export interface AdminPostRow {
  id: string;
  slug: string;
  title: string;
  tag: string | null;
  status: ContentStatus;
  publishedAt: string | null;
  updatedAt: string;
  cover: CatalogImage | null;
}

export interface AdminPost extends AdminPostRow {
  excerpt: string | null;
  body: string | null;
  author: string | null;
  readMinutes: number;
  coverAssetId: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
}

export interface PostInput {
  title: string;
  slug?: string;
  excerpt: string | null;
  body: string | null;
  tag: string | null;
  author: string | null;
  coverAssetId: string | null;
  status: ContentStatus;
  publishedAt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
}

export interface AdminPageRow {
  id: string;
  slug: string;
  title: string;
  status: ContentStatus;
  updatedAt: string;
}

export interface AdminPage extends AdminPageRow {
  intro: string | null;
  body: string | null;
  publishedAt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
}

export interface PageInput {
  title: string;
  slug: string;
  intro: string | null;
  body: string | null;
  status: ContentStatus;
  metaTitle: string | null;
  metaDescription: string | null;
}

export interface FaqItem {
  id: string;
  group: string | null;
  question: string;
  answer: string;
  isPublished: boolean;
  sortOrder: number;
}

export type FaqInput = Omit<FaqItem, "id">;

export type SubscriberStatus = "PENDING" | "SUBSCRIBED" | "UNSUBSCRIBED";

export interface Subscriber {
  id: string;
  email: string;
  status: SubscriberStatus;
  source: string | null;
  confirmedAt: string | null;
  unsubscribedAt: string | null;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  orderNumber: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface Envelope<T> {
  data: T;
  meta?: PageMeta;
}

const unwrap = <T>(response: Envelope<T>) => response.data;
const params = (query: object) =>
  Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined && value !== ""));

export const adminContentApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAdminPosts: build.query<
      { data: AdminPostRow[]; meta: PageMeta },
      { page?: number; search?: string; status?: ContentStatus }
    >({
      query: (query) => ({ url: "/posts/admin/list", params: params({ ...query, limit: 20 }) }),
      transformResponse: (response: Envelope<AdminPostRow[]>) => ({ data: response.data, meta: response.meta! }),
      providesTags: [{ type: "Post", id: "LIST" }],
    }),
    getAdminPost: build.query<AdminPost, string>({
      query: (id) => `/posts/admin/${id}`,
      transformResponse: unwrap<AdminPost>,
      providesTags: (_r, _e, id) => [{ type: "Post", id }],
    }),
    createPost: build.mutation<AdminPost, PostInput>({
      query: (body) => ({ url: "/posts/admin", method: "POST", body }),
      transformResponse: unwrap<AdminPost>,
      invalidatesTags: [{ type: "Post", id: "LIST" }],
    }),
    updatePost: build.mutation<AdminPost, { id: string; body: Partial<PostInput> }>({
      query: ({ id, body }) => ({ url: `/posts/admin/${id}`, method: "PATCH", body }),
      transformResponse: unwrap<AdminPost>,
      invalidatesTags: (_r, _e, { id }) => [{ type: "Post", id: "LIST" }, { type: "Post", id }],
    }),
    deletePost: build.mutation<void, string>({
      query: (id) => ({ url: `/posts/admin/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Post", id: "LIST" }],
    }),

    getAdminPages: build.query<AdminPageRow[], void>({
      query: () => "/pages/admin/list",
      transformResponse: unwrap<AdminPageRow[]>,
      providesTags: [{ type: "ContentPage", id: "LIST" }],
    }),
    getAdminPage: build.query<AdminPage, string>({
      query: (id) => `/pages/admin/${id}`,
      transformResponse: unwrap<AdminPage>,
      providesTags: (_r, _e, id) => [{ type: "ContentPage", id }],
    }),
    createPage: build.mutation<AdminPage, PageInput>({
      query: (body) => ({ url: "/pages/admin", method: "POST", body }),
      transformResponse: unwrap<AdminPage>,
      invalidatesTags: [{ type: "ContentPage", id: "LIST" }],
    }),
    updatePage: build.mutation<AdminPage, { id: string; body: Partial<PageInput> }>({
      query: ({ id, body }) => ({ url: `/pages/admin/${id}`, method: "PATCH", body }),
      transformResponse: unwrap<AdminPage>,
      invalidatesTags: (_r, _e, { id }) => [{ type: "ContentPage", id: "LIST" }, { type: "ContentPage", id }],
    }),
    deletePage: build.mutation<void, string>({
      query: (id) => ({ url: `/pages/admin/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "ContentPage", id: "LIST" }],
    }),

    getAdminFaq: build.query<FaqItem[], void>({
      query: () => "/faq/admin/list",
      transformResponse: unwrap<FaqItem[]>,
      providesTags: ["Faq"],
    }),
    createFaq: build.mutation<FaqItem, Partial<FaqInput>>({
      query: (body) => ({ url: "/faq/admin", method: "POST", body }),
      invalidatesTags: ["Faq"],
    }),
    updateFaq: build.mutation<FaqItem, { id: string; body: Partial<FaqInput> }>({
      query: ({ id, body }) => ({ url: `/faq/admin/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Faq"],
    }),
    deleteFaq: build.mutation<void, string>({
      query: (id) => ({ url: `/faq/admin/${id}`, method: "DELETE" }),
      invalidatesTags: ["Faq"],
    }),

    getSubscribers: build.query<
      { subscribers: Subscriber[]; counts: Record<SubscriberStatus, number>; meta: PageMeta },
      { page?: number; search?: string; status?: SubscriberStatus }
    >({
      query: (query) => ({ url: "/newsletter/admin/list", params: params({ ...query, limit: 50 }) }),
      transformResponse: (
        response: Envelope<{ subscribers: Subscriber[]; counts: Record<SubscriberStatus, number> }>,
      ) => ({ ...response.data, meta: response.meta! }),
      providesTags: ["Subscriber"],
    }),
    deleteSubscriber: build.mutation<void, string>({
      query: (id) => ({ url: `/newsletter/admin/${id}`, method: "DELETE" }),
      invalidatesTags: ["Subscriber"],
    }),

    getMessages: build.query<
      { messages: ContactMessage[]; unread: number; meta: PageMeta },
      { page?: number; search?: string; unread?: boolean }
    >({
      query: ({ unread, ...query }) => ({
        url: "/contact/admin/list",
        params: params({ ...query, unread: unread ? "true" : undefined, limit: 30 }),
      }),
      transformResponse: (response: Envelope<{ messages: ContactMessage[]; unread: number }>) => ({
        ...response.data,
        meta: response.meta!,
      }),
      providesTags: ["Message"],
    }),
    updateMessage: build.mutation<ContactMessage, { id: string; isRead: boolean }>({
      query: ({ id, isRead }) => ({ url: `/contact/admin/${id}`, method: "PATCH", body: { isRead } }),
      invalidatesTags: ["Message"],
    }),
    deleteMessage: build.mutation<void, string>({
      query: (id) => ({ url: `/contact/admin/${id}`, method: "DELETE" }),
      invalidatesTags: ["Message"],
    }),
  }),
});

export const {
  useGetAdminPostsQuery,
  useGetAdminPostQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useGetAdminPagesQuery,
  useGetAdminPageQuery,
  useCreatePageMutation,
  useUpdatePageMutation,
  useDeletePageMutation,
  useGetAdminFaqQuery,
  useCreateFaqMutation,
  useUpdateFaqMutation,
  useDeleteFaqMutation,
  useGetSubscribersQuery,
  useDeleteSubscriberMutation,
  useGetMessagesQuery,
  useUpdateMessageMutation,
  useDeleteMessageMutation,
} = adminContentApi;
