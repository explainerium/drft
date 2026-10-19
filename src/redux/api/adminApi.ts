import type {
  AdminOrder,
  AdminOrderRow,
  Customer,
  CustomerListQuery,
  CustomerRow,
  DashboardRange,
  DashboardSummary,
  OrderListQuery,
  StatusChangeInput,
  TrackingInput,
} from "@/types/admin";
import type { User } from "@/types/auth";
import type { OrderStatus, PageMeta } from "@/types/checkout";
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
 * Staff endpoints. Admin data has its own tags, so the storefront's cached
 * customer data (the signed-in staff member's own orders) never mixes with it.
 * An order change answers with the whole order, which replaces the cached one.
 */
export const adminApi = baseApi.injectEndpoints({
  endpoints: (build) => {
    const orderChange = {
      transformResponse: (response: Envelope<AdminOrder>) => response.data,
      invalidatesTags: ["AdminOrder" as const, "Dashboard" as const],
    };

    return {
      getDashboard: build.query<DashboardSummary, DashboardRange>({
        query: (days) => ({ url: "/dashboard/summary", params: { days } }),
        transformResponse: unwrap<DashboardSummary>,
        providesTags: ["Dashboard"],
      }),
      getAdminOrders: build.query<Page<AdminOrderRow>, OrderListQuery>({
        query: (query) => ({ url: "/orders/admin/list", params: params(query) }),
        transformResponse: page<AdminOrderRow>,
        providesTags: ["AdminOrder"],
      }),
      getOrderCounts: build.query<Record<OrderStatus, number>, void>({
        query: () => "/orders/admin/counts",
        transformResponse: unwrap<Record<OrderStatus, number>>,
        providesTags: ["AdminOrder"],
      }),
      getAdminOrder: build.query<AdminOrder, string>({
        query: (id) => `/orders/admin/${id}`,
        transformResponse: unwrap<AdminOrder>,
        providesTags: (_result, _error, id) => [{ type: "AdminOrder", id }],
      }),
      changeOrderStatus: build.mutation<AdminOrder, { id: string } & StatusChangeInput>({
        query: ({ id, ...body }) => ({ url: `/orders/admin/${id}/status`, method: "PATCH", body }),
        ...orderChange,
      }),
      updateOrderTracking: build.mutation<AdminOrder, { id: string } & TrackingInput>({
        query: ({ id, ...body }) => ({ url: `/orders/admin/${id}/tracking`, method: "PATCH", body }),
        ...orderChange,
      }),
      addOrderNote: build.mutation<AdminOrder, { id: string; body: string }>({
        query: ({ id, body }) => ({ url: `/orders/admin/${id}/notes`, method: "POST", body: { body } }),
        ...orderChange,
      }),

      getCustomers: build.query<Page<CustomerRow>, CustomerListQuery>({
        query: (query) => ({ url: "/users", params: params({ ...query, role: "CUSTOMER" }) }),
        transformResponse: page<CustomerRow>,
        providesTags: ["Customer"],
      }),
      getCustomer: build.query<Customer, string>({
        query: (id) => `/users/${id}`,
        transformResponse: unwrap<Customer>,
        providesTags: (_result, _error, id) => [{ type: "Customer", id }],
      }),
      updateCustomer: build.mutation<User, { id: string; status: User["status"] }>({
        query: ({ id, ...body }) => ({ url: `/users/${id}`, method: "PATCH", body }),
        transformResponse: unwrap<User>,
        invalidatesTags: ["Customer"],
      }),
    };
  },
});

export const {
  useGetDashboardQuery,
  useGetAdminOrdersQuery,
  useGetOrderCountsQuery,
  useGetAdminOrderQuery,
  useChangeOrderStatusMutation,
  useUpdateOrderTrackingMutation,
  useAddOrderNoteMutation,
  useGetCustomersQuery,
  useGetCustomerQuery,
  useUpdateCustomerMutation,
} = adminApi;
