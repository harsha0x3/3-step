import { rootApiSlice } from "@/store/rootApiSlice";
import type { ApiResponse } from "@/store/rootTypes";
import type {
  NewCandidatePayload,
  CandidateItemWithStore,
  CandidatesSearchParams,
  UpdateCandidatePayload,
} from "../types";

export const candidatesApiSlice = rootApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ➕ Add a new candidate
    addNewCandidate: builder.mutation<
      ApiResponse<{ candidate: CandidateItemWithStore } | unknown>,
      NewCandidatePayload
    >({
      query: (payload) => ({
        url: `/candidates`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Candidates"],
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
      invalidatesTags: ["Candidates"],
    }),

    // 📋 Get all candidates (with optional search)
    getAllCandidates: builder.query<
      ApiResponse<
        { candidates: CandidateItemWithStore[]; count: number } | unknown
      >,
      CandidatesSearchParams | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.search_by)
          searchParams.append("search_by", params.search_by);
        if (params?.search_term)
          searchParams.append("search_term", params.search_term);
        const queryString = searchParams.toString();
        return `/candidates${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: ["Candidates"],
    }),

    // 🏪 Get all candidates belonging to a specific store
    getCandidatesOfStore: builder.query<
      ApiResponse<
        { candidates: CandidateItemWithStore[]; count: number } | unknown
      >,
      void
    >({
      query: () => `/candidates/store`,
      providesTags: ["Candidates"],
    }),

    uploadCandidatePhoto: builder.mutation<
      any,
      { candidateId: string; formData: FormData }
    >({
      query: ({ candidateId, formData }) => ({
        url: `candidates/${candidateId}/upload-photo`,
        method: "PATCH",
        body: formData,
      }),
      invalidatesTags: ["Candidates"],
    }),

    getCandidateById: builder.query<
      ApiResponse<CandidateItemWithStore | unknown>,
      string
    >({
      query: (candidateId: string) => `candidates/details/${candidateId}`,
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
} = candidatesApiSlice;
