import { rootApiSlice } from "@/store/rootApiSlice";
import type {
  City,
  NewStorePayload,
  StoreItem,
  StoreItemWithUser,
  StoreSearchParams,
} from "../types";
import type { ApiResponse } from "@/store/rootTypes";
import type { UserItem } from "@/features/auth/types";
export const productStoresApiSlice = rootApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    addNewStore: builder.mutation<
      ApiResponse<{ store: StoreItem; credentials: UserItem } | unknown>,
      NewStorePayload
    >({
      query: (payload) => ({
        url: `/stores`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Stores"],
    }),

    updateStore: builder.mutation<
      ApiResponse<{ store: StoreItemWithUser } | unknown>,
      { storeId: string; payload: Partial<NewStorePayload> }
    >({
      query: ({ storeId, payload }) => ({
        url: `/stores/${storeId}`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: ["Stores"],
    }),

    getAllCities: builder.query<ApiResponse<City[]>, void>({
      query: () => `/stores/cities`,
    }),

    getAllStores: builder.query<
      ApiResponse<{
        stores: StoreItemWithUser[];
        total_stock: number;
        count: number;
      }>,
      StoreSearchParams
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
        return `/stores?${searchParams.toString()}`;
      },
      providesTags: ["Stores"],
    }),

    getUserStore: builder.query<ApiResponse<{ store: StoreItem }>, void>({
      query: () => `/stores/my-store`,
      providesTags: ["Stores"],
    }),

    getOfflineUploadHistory: builder.query({
      query: (storeId) => {
        if (storeId) {
          const params = new URLSearchParams({
            store_id: storeId,
          });
          return `/stores/offline/history?${params.toString()}`;
        }
        return `/stores/offline/history`;
      },
    }),
    getOfflineUploadDetails: builder.query({
      query: ({ storeId, uploadId }) => {
        if (storeId) {
          const params = new URLSearchParams({
            store_id: storeId,
          });
          return `/stores/offline/report-details/${uploadId}?${params.toString()}`;
        }
        return `/stores/offline/report-details/${uploadId}`;
      },
    }),

    uploadOfflineReport: builder.mutation({
      query: (formData: FormData) => ({
        url: "/stores/upload/offline/issuance",
        method: "POST",
        body: formData,
      }),
    }),

    downloadStoreAllotment: builder.mutation({
      query: () => ({
        url: "/dashboard/download/store-allotment",
        method: "GET",
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
});

export const {
  useAddNewStoreMutation,
  useGetAllStoresQuery,
  useUpdateStoreMutation,
  useGetUserStoreQuery,
  useGetOfflineUploadDetailsQuery,
  useGetOfflineUploadHistoryQuery,
  useUploadOfflineReportMutation,
  useGetAllCitiesQuery,
  useDownloadStoreAllotmentMutation,
} = productStoresApiSlice;
