import { rootApiSlice } from "@/store/rootApiSlice";
import type { ApiResponse } from "@/store/rootTypes";
import type { NewVendor, VendorItem, VendorSpocItem } from "../types";

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

    getAllVendors: builder.query<
      ApiResponse<VendorItem[]>,
      { searchTerm: string }
    >({
      query: ({ searchTerm }) => {
        const params = new URLSearchParams({ search_term: searchTerm });
        return `/vendors?${params.toString()}`;
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
      ApiResponse<VendorSpocItem[]>,
      { searchTerm: string }
    >({
      query: ({ searchTerm }) => {
        const params = new URLSearchParams({ search_term: searchTerm });
        return `/vendors/spoc?${params.toString()}`;
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
