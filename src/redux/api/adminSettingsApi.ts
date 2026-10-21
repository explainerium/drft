import type {
  RateInput,
  SettingGroup,
  SettingGroups,
  ShippingZone,
  StaffInput,
  StaffMember,
  VatRate,
  ZoneInput,
} from "@/types/adminSettings";
import type { User } from "@/types/auth";
import { baseApi } from "./baseApi";

interface Envelope<T> {
  data: T;
}

const unwrap = <T>(response: Envelope<T>) => response.data;

/**
 * Store setup for admins: shipping zones and rates, VAT per country, the
 * settings groups and staff accounts. The API refuses staff without the ADMIN role.
 */
export const adminSettingsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getShippingZones: build.query<ShippingZone[], void>({
      query: () => "/shipping/admin/zones",
      transformResponse: unwrap<ShippingZone[]>,
      providesTags: ["Shipping"],
    }),
    createZone: build.mutation<ShippingZone, ZoneInput>({
      query: (body) => ({ url: "/shipping/admin/zones", method: "POST", body }),
      invalidatesTags: ["Shipping"],
    }),
    updateZone: build.mutation<ShippingZone, { id: string; body: Partial<ZoneInput> }>({
      query: ({ id, body }) => ({ url: `/shipping/admin/zones/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Shipping"],
    }),
    deleteZone: build.mutation<void, string>({
      query: (id) => ({ url: `/shipping/admin/zones/${id}`, method: "DELETE" }),
      invalidatesTags: ["Shipping"],
    }),
    createRate: build.mutation<ShippingZone, { zoneId: string; body: RateInput }>({
      query: ({ zoneId, body }) => ({ url: `/shipping/admin/zones/${zoneId}/rates`, method: "POST", body }),
      invalidatesTags: ["Shipping"],
    }),
    updateRate: build.mutation<ShippingZone, { rateId: string; body: Partial<RateInput> }>({
      query: ({ rateId, body }) => ({ url: `/shipping/admin/rates/${rateId}`, method: "PATCH", body }),
      invalidatesTags: ["Shipping"],
    }),
    deleteRate: build.mutation<ShippingZone, string>({
      query: (rateId) => ({ url: `/shipping/admin/rates/${rateId}`, method: "DELETE" }),
      invalidatesTags: ["Shipping"],
    }),

    getVatRates: build.query<VatRate[], void>({
      query: () => "/tax/admin",
      transformResponse: unwrap<VatRate[]>,
      providesTags: ["Vat"],
    }),
    saveVatRate: build.mutation<VatRate, { countryCode: string; rate: number }>({
      query: ({ countryCode, rate }) => ({ url: `/tax/admin/${countryCode}`, method: "PUT", body: { rate } }),
      invalidatesTags: ["Vat"],
    }),
    deleteVatRate: build.mutation<void, string>({
      query: (countryCode) => ({ url: `/tax/admin/${countryCode}`, method: "DELETE" }),
      invalidatesTags: ["Vat"],
    }),

    getSettings: build.query<SettingGroups[SettingGroup], SettingGroup>({
      query: (group) => `/settings/${group}`,
      transformResponse: unwrap<SettingGroups[SettingGroup]>,
      providesTags: (_result, _error, group) => [{ type: "Setting", id: group }],
    }),
    saveSettings: build.mutation<SettingGroups[SettingGroup], { group: SettingGroup; body: object }>({
      query: ({ group, body }) => ({ url: `/settings/${group}`, method: "PUT", body }),
      transformResponse: unwrap<SettingGroups[SettingGroup]>,
      invalidatesTags: (_result, _error, { group }) => [{ type: "Setting", id: group }, "Dashboard"],
    }),

    getStaff: build.query<StaffMember[], void>({
      // Admins and staff are listed by role; a shop has a handful of each.
      async queryFn(_arg, _api, _extra, fetchWithBQ) {
        const results = await Promise.all(
          (["ADMIN", "STAFF"] as const).map((role) => fetchWithBQ({ url: "/users", params: { role, limit: 100 } })),
        );
        const failed = results.find((result) => result.error);
        if (failed?.error) return { error: failed.error };
        return {
          data: results.flatMap((result) => (result.data as Envelope<StaffMember[]>).data),
        };
      },
      providesTags: ["Staff"],
    }),
    createStaff: build.mutation<User, StaffInput>({
      query: (body) => ({ url: "/users/staff", method: "POST", body }),
      invalidatesTags: ["Staff"],
    }),
    updateStaff: build.mutation<User, { id: string; body: Partial<Pick<User, "role" | "status">> }>({
      query: ({ id, body }) => ({ url: `/users/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Staff"],
    }),
    removeStaff: build.mutation<void, string>({
      query: (id) => ({ url: `/users/${id}`, method: "DELETE" }),
      invalidatesTags: ["Staff"],
    }),
  }),
});

export const {
  useGetShippingZonesQuery,
  useCreateZoneMutation,
  useUpdateZoneMutation,
  useDeleteZoneMutation,
  useCreateRateMutation,
  useUpdateRateMutation,
  useDeleteRateMutation,
  useGetVatRatesQuery,
  useSaveVatRateMutation,
  useDeleteVatRateMutation,
  useGetSettingsQuery,
  useSaveSettingsMutation,
  useGetStaffQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useRemoveStaffMutation,
} = adminSettingsApi;

/** A settings group with its own type. */
export function useSettingsGroup<G extends SettingGroup>(group: G, options?: { skip?: boolean }) {
  const result = useGetSettingsQuery(group, options);
  return { ...result, data: result.data as SettingGroups[G] | undefined };
}
