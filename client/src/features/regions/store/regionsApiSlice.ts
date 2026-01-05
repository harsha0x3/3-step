import { rootApiSlice } from "@/store/rootApiSlice";
import type { ApiResponse, RegionOut } from "@/store/rootTypes";

const regionsApiSlice = rootApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllRegions: builder.query<ApiResponse<RegionOut[]>, { name?: string }>({
      query: (params) => {
        return { url: "/regions", method: "GET", params };
      },
    }),

    createRegion: builder.mutation<RegionOut, { name: string }>({
      query: (payload) => ({
        url: "/regions",
        method: "POST",
        body: payload,
      }),
    }),
  }),
});
export const { useGetAllRegionsQuery, useCreateRegionMutation } =
  regionsApiSlice;
