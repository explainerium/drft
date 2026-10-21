import type {
  AdminAttribute,
  AdminCategory,
  AdminProduct,
  AdminProductRow,
  AttributeInput,
  AttributeValueInput,
  CategoryInput,
  MediaAsset,
  MediaFolder,
  MediaListQuery,
  ProductInput,
  ProductListQuery,
} from "@/types/adminCatalog";
import type { PageMeta } from "@/types/checkout";
import { baseApi } from "./baseApi";

interface Envelope<T> {
  data: T;
}

interface Page<T> {
  data: T[];
  meta: PageMeta;
}

const unwrap = <T>(response: Envelope<T>) => response.data;
const page = <T>(response: Page<T>) => ({ data: response.data, meta: response.meta });

/** Drops empty filters so they never reach the query string. */
const params = (query: object) =>
  Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined && value !== ""));

/**
 * Catalog endpoints for the admin. A save answers with the whole product,
 * which replaces the cached one; the storefront cache is refreshed separately
 * (revalidateStorefront).
 */
export const adminCatalogApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAdminProducts: build.query<Page<AdminProductRow>, ProductListQuery>({
      query: (query) => ({ url: "/products/admin/list", params: params(query) }),
      transformResponse: page<AdminProductRow>,
      providesTags: [{ type: "AdminProduct", id: "LIST" }],
    }),
    getAdminProduct: build.query<AdminProduct, string>({
      query: (id) => `/products/admin/${id}`,
      transformResponse: unwrap<AdminProduct>,
      providesTags: (_result, _error, id) => [{ type: "AdminProduct", id }],
    }),
    createProduct: build.mutation<AdminProduct, ProductInput>({
      query: (body) => ({ url: "/products/admin", method: "POST", body }),
      transformResponse: unwrap<AdminProduct>,
      invalidatesTags: [{ type: "AdminProduct", id: "LIST" }, "Dashboard"],
    }),
    updateProduct: build.mutation<AdminProduct, { id: string; body: Partial<ProductInput> }>({
      query: ({ id, body }) => ({ url: `/products/admin/${id}`, method: "PATCH", body }),
      transformResponse: unwrap<AdminProduct>,
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(adminCatalogApi.util.upsertQueryData("getAdminProduct", id, data));
        } catch {
          // The editor shows the error.
        }
      },
      invalidatesTags: [{ type: "AdminProduct", id: "LIST" }, "Dashboard"],
    }),
    deleteProduct: build.mutation<void, string>({
      query: (id) => ({ url: `/products/admin/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "AdminProduct", id: "LIST" }, "Dashboard"],
    }),
    getAdminCategories: build.query<AdminCategory[], void>({
      query: () => "/categories/admin/list",
      transformResponse: unwrap<AdminCategory[]>,
      providesTags: ["Category"],
    }),
    createCategory: build.mutation<AdminCategory, CategoryInput>({
      query: (body) => ({ url: "/categories/admin", method: "POST", body }),
      transformResponse: unwrap<AdminCategory>,
      invalidatesTags: ["Category"],
    }),
    updateCategory: build.mutation<AdminCategory, { id: string; body: Partial<CategoryInput> }>({
      query: ({ id, body }) => ({ url: `/categories/admin/${id}`, method: "PATCH", body }),
      transformResponse: unwrap<AdminCategory>,
      invalidatesTags: ["Category"],
    }),
    deleteCategory: build.mutation<void, string>({
      query: (id) => ({ url: `/categories/admin/${id}`, method: "DELETE" }),
      // Products lose the link, so their category lists change too.
      invalidatesTags: ["Category", { type: "AdminProduct", id: "LIST" }],
    }),

    getAdminAttributes: build.query<AdminAttribute[], void>({
      query: () => "/attributes/admin/list",
      transformResponse: unwrap<AdminAttribute[]>,
      providesTags: ["Attribute"],
    }),
    createAttribute: build.mutation<AdminAttribute, AttributeInput & { values?: AttributeValueInput[] }>({
      query: (body) => ({ url: "/attributes/admin", method: "POST", body }),
      transformResponse: unwrap<AdminAttribute>,
      invalidatesTags: ["Attribute"],
    }),
    updateAttribute: build.mutation<AdminAttribute, { id: string; body: Partial<AttributeInput> }>({
      query: ({ id, body }) => ({ url: `/attributes/admin/${id}`, method: "PATCH", body }),
      transformResponse: unwrap<AdminAttribute>,
      invalidatesTags: ["Attribute"],
    }),
    deleteAttribute: build.mutation<void, string>({
      query: (id) => ({ url: `/attributes/admin/${id}`, method: "DELETE" }),
      invalidatesTags: ["Attribute"],
    }),
    createAttributeValue: build.mutation<unknown, { attributeId: string; body: AttributeValueInput }>({
      query: ({ attributeId, body }) => ({ url: `/attributes/admin/${attributeId}/values`, method: "POST", body }),
      invalidatesTags: ["Attribute"],
    }),
    updateAttributeValue: build.mutation<unknown, { valueId: string; body: Partial<AttributeValueInput> }>({
      query: ({ valueId, body }) => ({ url: `/attributes/admin/values/${valueId}`, method: "PATCH", body }),
      // Variant option labels in the product editor come from here.
      invalidatesTags: ["Attribute"],
    }),
    deleteAttributeValue: build.mutation<void, string>({
      query: (valueId) => ({ url: `/attributes/admin/values/${valueId}`, method: "DELETE" }),
      invalidatesTags: ["Attribute"],
    }),

    getMedia: build.query<Page<MediaAsset>, MediaListQuery>({
      query: (query) => ({ url: "/media", params: params({ ...query, mimeType: "image/" }) }),
      transformResponse: page<MediaAsset>,
      providesTags: ["Media"],
    }),
    uploadMedia: build.mutation<MediaAsset, File | { file: File; folderId?: string | null }>({
      query: (input) => {
        const { file, folderId } = input instanceof File ? { file: input, folderId: null } : input;
        const body = new FormData();
        body.append("file", file);
        if (folderId) body.append("folderId", folderId);
        return { url: "/media", method: "POST", body };
      },
      transformResponse: unwrap<MediaAsset>,
      invalidatesTags: ["Media", "MediaFolder"],
    }),
    updateMedia: build.mutation<MediaAsset, { id: string; body: { alt?: string | null; folderId?: string | null } }>({
      query: ({ id, body }) => ({ url: `/media/${id}`, method: "PATCH", body }),
      transformResponse: unwrap<MediaAsset>,
      invalidatesTags: ["Media", "MediaFolder"],
    }),
    deleteMedia: build.mutation<void, string>({
      query: (id) => ({ url: `/media/${id}`, method: "DELETE" }),
      invalidatesTags: ["Media", "MediaFolder"],
    }),
    getMediaFolders: build.query<MediaFolder[], void>({
      query: () => "/media/folders",
      transformResponse: unwrap<MediaFolder[]>,
      providesTags: ["MediaFolder"],
    }),
    createMediaFolder: build.mutation<MediaFolder, { name: string; parentId?: string | null }>({
      query: (body) => ({ url: "/media/folders", method: "POST", body }),
      transformResponse: unwrap<MediaFolder>,
      invalidatesTags: ["MediaFolder"],
    }),
    updateMediaFolder: build.mutation<MediaFolder, { id: string; body: { name?: string; parentId?: string | null } }>({
      query: ({ id, body }) => ({ url: `/media/folders/${id}`, method: "PATCH", body }),
      transformResponse: unwrap<MediaFolder>,
      invalidatesTags: ["MediaFolder"],
    }),
    deleteMediaFolder: build.mutation<void, string>({
      query: (id) => ({ url: `/media/folders/${id}`, method: "DELETE" }),
      // Its images move up a level.
      invalidatesTags: ["MediaFolder", "Media"],
    }),
  }),
});

export const {
  useGetAdminProductsQuery,
  useGetAdminProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetAdminCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetAdminAttributesQuery,
  useCreateAttributeMutation,
  useUpdateAttributeMutation,
  useDeleteAttributeMutation,
  useCreateAttributeValueMutation,
  useUpdateAttributeValueMutation,
  useDeleteAttributeValueMutation,
  useGetMediaQuery,
  useUploadMediaMutation,
  useUpdateMediaMutation,
  useDeleteMediaMutation,
  useGetMediaFoldersQuery,
  useCreateMediaFolderMutation,
  useUpdateMediaFolderMutation,
  useDeleteMediaFolderMutation,
} = adminCatalogApi;

/** Tells the storefront to refresh cached reads after a save. A failure here never undoes the save. */
export async function revalidateTags(tags: string[]): Promise<void> {
  await fetch("/api/internal/revalidate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ tags }),
  }).catch(() => undefined);
}

/** The catalog after a product, category, attribute or media save. */
export const revalidateStorefront = (slugs: string[]) =>
  revalidateTags(["products", "categories", ...slugs.map((slug) => `product:${slug}`)]);
