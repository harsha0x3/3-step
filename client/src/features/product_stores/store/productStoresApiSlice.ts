import { rootApiSlice } from "@/store/rootApiSlice";
import type { NewStorePayload, StoreItem, StoreItemWithUser } from "../types";
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

    getAllStores: builder.query<
      ApiResponse<{
        stores: StoreItemWithUser[];
        count: number;
        cities: string[];
      }>,
      { searchBy: string; searchTerm: string }
    >({
      query: ({ searchBy, searchTerm }) => {
        const params = new URLSearchParams({
          search_by: searchBy,
          search_term: searchTerm,
        });
        return `/stores?${params.toString()}`;
      },
      providesTags: ["Stores"],
    }),

    getUserStore: builder.query<ApiResponse<{ store: StoreItem }>, void>({
      query: () => `/stores/my-store`,
    }),
  }),
});

export const {
  useAddNewStoreMutation,
  useGetAllStoresQuery,
  useUpdateStoreMutation,
  useGetUserStoreQuery,
} = productStoresApiSlice;
