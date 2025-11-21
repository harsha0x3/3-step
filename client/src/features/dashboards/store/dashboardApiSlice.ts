import { rootApiSlice } from "@/store/rootApiSlice";

export interface DashboardStats {
  count_of_total_candidates: number;
  count_of_verified_candidates: number;
  count_of_candidate_recieved_laptops: number;
  count_of_stores: number;
}

export const dashboardApiAlice = rootApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    downloadCandidates: builder.mutation<Blob, void>({
      query: () => ({
        url: "/dashboard/download/candidates",
        method: "GET",
        responseHandler: async (response) => response.blob(),
      }),
    }),
    getDashboardStats: builder.query<
      { msg: string; data: DashboardStats },
      void
    >({
      query: () => "/dashboard/stats/brief",
    }),
  }),
});

export const { useDownloadCandidatesMutation, useGetDashboardStatsQuery } =
  dashboardApiAlice;
