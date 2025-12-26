import { rootApiSlice } from "@/store/rootApiSlice";
import type { ApiResponse } from "@/store/rootTypes";
import type {
  NewCandidatePayload,
  CandidateItemWithStore,
  CandidatesSearchParams,
  UpdateCandidatePayload,
  PartialCandidateItem,
} from "../types";

export const candidatesApiSlice = rootApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ➕ Add a new candidate
    addNewCandidate: builder.mutation<
      ApiResponse<
        | {
            candidate: CandidateItemWithStore;
            count: number;
            total_count: number;
          }
        | unknown
      >,
      NewCandidatePayload
    >({
      query: (payload) => ({
        url: `/candidates`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Candidates", "Stores"],
    }),

    updateCandidate: builder.mutation<
      ApiResponse<{ candidate: CandidateItemWithStore } | unknown>,
      {
        payload: UpdateCandidatePayload;
        candidateId: string;
      }
    >({
      query: ({ candidateId, payload }) => ({
        url: `/candidates/${candidateId}`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: ["Candidates", "Stores"],
    }),

    // 📋 Get all candidates (with optional search)
    getAllCandidates: builder.query<
      ApiResponse<{
        candidates: CandidateItemWithStore[];
        count: number;
        total_count: number;
      }>,
      CandidatesSearchParams
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
        if (!(params?.is_issued === null || params?.is_issued === undefined))
          searchParams.append("is_issued", String(params.is_issued));
        if (
          !(params?.is_verified === null || params?.is_verified === undefined)
        )
          searchParams.append("is_verified", String(params.is_verified));
        if (
          !(
            params?.upgrade_request === null ||
            params?.upgrade_request === undefined
          )
        )
          searchParams.append(
            "upgrade_request",
            String(params.upgrade_request)
          );

        const queryString = searchParams.toString();
        return `/candidates${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: ["Candidates"],
    }),

    // 🏪 Get all candidates belonging to a specific store
    getCandidatesOfStore: builder.query<
      ApiResponse<
        | {
            candidates: PartialCandidateItem[];
            count: number;
            total_count: number;
          }
        | unknown
      >,
      CandidatesSearchParams | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params) {
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
          if (!(params?.is_issued === null || params?.is_issued === undefined))
            searchParams.append("is_issued", String(params.is_issued));
          if (
            !(params?.is_verified === null || params?.is_verified === undefined)
          )
            searchParams.append("is_verified", String(params.is_verified));
          if (
            !(
              params?.upgrade_request === null ||
              params?.upgrade_request === undefined
            )
          )
            searchParams.append(
              "upgrade_request",
              String(params.upgrade_request)
            );
        }
        return `/candidates/store?${searchParams.toString()}`;
      },

      providesTags: ["Candidates"],
    }),

    uploadCandidatePhoto: builder.mutation<
      any,
      { candidateId: string; formData: FormData }
    >({
      query: ({ candidateId, formData }) => ({
        url: `/candidates/upload-photo/${candidateId}`,
        method: "PATCH",
        body: formData,
      }),
      invalidatesTags: ["Candidates"],
    }),

    getCandidateById: builder.query<
      ApiResponse<{ candidate: CandidateItemWithStore }>,
      string
    >({
      query: (candidateId: string) => `/candidates/details/${candidateId}`,
      providesTags: ["Candidates"],
    }),

    addCandidateAadhar: builder.mutation<
      ApiResponse<CandidateItemWithStore | unknown>,
      { candidateId: string; formData: FormData }
    >({
      query: ({ candidateId, formData }) => ({
        url: `/candidates/add-aadhar/${candidateId}`,
        method: "PATCH",
        body: formData,
      }),
      invalidatesTags: ["Candidates"],
    }),
    resetVoucherIssuance: builder.mutation<
      ApiResponse<CandidateItemWithStore | unknown>,
      { candidateId: string }
    >({
      query: ({ candidateId }) => ({
        url: `/candidates/${candidateId}/reset/voucher_issuance`,
        method: "PATCH",
      }),
      invalidatesTags: ["Candidates"],
    }),

    downloadCandidates: builder.mutation({
      query: () => ({
        url: "/download/candidates",
        method: "GET",
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
});

export const {
  useAddNewCandidateMutation,
  useUpdateCandidateMutation,
  useGetAllCandidatesQuery,
  useGetCandidatesOfStoreQuery,
  useUploadCandidatePhotoMutation,
  useLazyGetCandidateByIdQuery,
  useGetCandidateByIdQuery,
  useLazyGetAllCandidatesQuery,
  useAddCandidateAadharMutation,
  useResetVoucherIssuanceMutation,
  useDownloadCandidatesMutation,
} = candidatesApiSlice;
