import { rootApiSlice } from "@/store/rootApiSlice";
import type { ApiResponse } from "@/store/rootTypes";
import type {
  NewVendor,
  VendorItem,
  VendorSpocItem,
  VendorSpocSearchParams,
  VendorsSearchParams,
} from "../types";

export const vendorsApiSlice = rootApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    addNewVendor: builder.mutation<ApiResponse<VendorItem>, NewVendor>({
      query: (payload) => ({
        url: `/vendors`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Vendors"],
    }),
    addNewVendorSpoc: builder.mutation<
      ApiResponse<VendorSpocItem | unknown>,
      { vendorId: string; formData: FormData }
    >({
      query: ({ vendorId, formData }) => ({
        url: `/vendors/${vendorId}`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["VendorsSpoc"],
    }),

    // 📋 Get all vendors (with pagination, search, sort)
    getAllVendors: builder.query<
      ApiResponse<{
        vendors: VendorItem[];
        count: number;
        total_count: number;
      }>,
      VendorsSearchParams
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();

        if (params?.search_by)
          searchParams.append("search_by", params.search_by);
        if (params?.search_term)
          searchParams.append("search_term", params.search_term);
        if (params?.page) searchParams.append("page", String(params.page));
        if (params?.page_size)
          searchParams.append("page_size", String(params.page_size));
        if (params?.sort_by)
          searchParams.append("sort_by", String(params.sort_by));
        if (params?.sort_order)
          searchParams.append("sort_order", String(params.sort_order));

        const queryString = searchParams.toString();
        return `/vendors?${queryString}`;
      },
      providesTags: ["Vendors"],
    }),

    updateVendor: builder.mutation<
      ApiResponse<VendorSpocItem | unknown>,
      { vendorId: string; payload: Partial<NewVendor> }
    >({
      query: ({ vendorId, payload }) => ({
        url: `/vendors/${vendorId}`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: ["Vendors"],
    }),

    updateVendorSpoc: builder.mutation<
      ApiResponse<VendorSpocItem | unknown>,
      { vendorSpocId: string; formData: FormData }
    >({
      query: ({ vendorSpocId, formData }) => ({
        url: `/vendors/spoc/${vendorSpocId}`,
        method: "PATCH",
        body: formData,
      }),
      invalidatesTags: ["VendorsSpoc"],
    }),

    getAllVendorSpoc: builder.query<
      ApiResponse<{
        vendor_spocs: VendorSpocItem[];
        count: number;
        total_count: number;
      }>,
      VendorSpocSearchParams
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();

        if (params?.search_by)
          searchParams.append("search_by", params.search_by);
        if (params?.search_term)
          searchParams.append("search_term", params.search_term);
        if (params?.vendor_id)
          searchParams.append("vendor_id", params.vendor_id);
        if (params?.page) searchParams.append("page", String(params.page));
        if (params?.page_size)
          searchParams.append("page_size", String(params.page_size));
        if (params?.sort_by)
          searchParams.append("sort_by", String(params.sort_by));
        if (params?.sort_order)
          searchParams.append("sort_order", String(params.sort_order));

        const queryString = searchParams.toString();
        return `/vendors/spoc?${queryString}`;
      },
      providesTags: ["VendorsSpoc"],
    }),
  }),
});

export const {
  useAddNewVendorMutation,
  useAddNewVendorSpocMutation,
  useGetAllVendorSpocQuery,
  useGetAllVendorsQuery,
  useUpdateVendorMutation,
  useUpdateVendorSpocMutation,
} = vendorsApiSlice;
