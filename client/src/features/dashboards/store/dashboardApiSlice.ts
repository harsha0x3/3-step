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

    getRoleBasedStats: builder.query({
      query: () => "/dashboard/stats/role-based",
      providesTags: ["Dashboard"],
    }),

    bulkUploadIssuance: builder.mutation({
      query: (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: "/dashboard/bulk-upload/issuance",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Dashboard", "Candidates", "Issuance"],
    }),

    downloadBulkTemplate: builder.query({
      query: () => ({
        url: "/dashboard/bulk-upload/template",
        method: "GET",
        responseHandler: async (response) => response.blob(),
      }),
    }),

    getRegionWiseStats: builder.query({
      query: (regionId: string) => `/dashboard/stats/region-wise/${regionId}`,
      providesTags: ["Dashboard"],
    }),
  }),
});

export const {
  useDownloadCandidatesMutation,
  useGetRoleBasedStatsQuery,
  useBulkUploadIssuanceMutation,
  useLazyDownloadBulkTemplateQuery,
  useGetRegionWiseStatsQuery,
} = dashboardApiAlice;
