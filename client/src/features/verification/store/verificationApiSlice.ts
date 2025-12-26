import { rootApiSlice } from "@/store/rootApiSlice";
import type { ApiResponse } from "@/store/rootTypes";
import type {
  IssuedStatusWithUpgrade,
  LatestIssuer,
  OverrideRequest,
  OverrideResult,
  RequestForUploadPayload,
  RequestNewUpgrade,
  UpgradeRequestOut,
  UpgradeRequestPayload,
  VerificationResult,
  VerificationStatusItem,
} from "../types";
import type { CandidateItemWithStore } from "@/features/candidates/types";
export const verificationApi = rootApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    verifyFace: builder.mutation<
      unknown,
      { candidateId: string; formData: FormData }
    >({
      query: ({ candidateId, formData }) => ({
        url: `/verify/find-candidate/face/${candidateId}`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["VerificationStatus"],
    }),
    sendOtp: builder.mutation<ApiResponse<{ expires_at: string }>, string>({
      query: (candidateId: string) => ({
        url: `/verify/otp/re-send/candidate/${candidateId}`,
        method: "POST",
      }),
    }),
    sendOtpToAdmin: builder.mutation<
      ApiResponse<{
        expires_at: string;
        admin_mail?: string;
        admin_phone?: string;
      }>,
      string
    >({
      query: (candidateId: string) => ({
        url: `/verify/otp/send/to_admin/candidate/${candidateId}`,
        method: "POST",
      }),
    }),
    verifyOtp: builder.mutation<
      ApiResponse<{ is_requested_for_upgrade: boolean }>,
      { candidateId: string; otp: string }
    >({
      query: ({ candidateId, otp }) => ({
        url: `/verify/otp/candidate/${candidateId}`,
        method: "POST",
        body: { otp },
        headers: { "Content-Type": "application/json" },
      }),
      invalidatesTags: ["VerificationStatus"],
    }),
    verifyCandidateDetails: builder.mutation({
      query: (candidateId: string) => ({
        url: `/verify/candidate-details/${candidateId}`,
        method: "POST",
      }),
      invalidatesTags: ["Candidates"],
    }),
    verifyCoupon: builder.mutation({
      query: ({ candidateId, couponCode }) => ({
        url: `/verify/verify-coupon/candidate/${candidateId}`,
        method: "POST",
        body: { coupon_code: couponCode },
      }),
      invalidatesTags: ["Candidates", "VerificationStatus"],
    }),
    addCouponToCandidate: builder.mutation({
      query: ({ candidateId, couponCode }) => ({
        url: `/verify/add-coupon/candidate/${candidateId}`,
        method: "POST",
        body: { coupon_code: couponCode },
      }),
      invalidatesTags: ["Candidates"],
    }),
    verifyCandidateAadhar: builder.mutation({
      query: ({ candidateId, aadharNumber }) => ({
        url: `/verify/verify-aadhar/candidate/${candidateId}`,
        method: "POST",
        body: { aadhar_number: aadharNumber },
      }),
      invalidatesTags: ["Candidates"],
    }),
    getCandidateVerificationStatus: builder.query<
      ApiResponse<VerificationStatusItem>,
      string
    >({
      query: (candidateId) => ({
        url: `/verify/status/candidate/${candidateId}`,
        method: "GET",
      }),
      providesTags: ["VerificationStatus"],
    }),

    getCandidateIssuanceDetails: builder.query<
      ApiResponse<IssuedStatusWithUpgrade>,
      string
    >({
      query: (candidateId) => ({
        url: `/verify/issuance-details/candidate/${candidateId}`,
        method: "GET",
      }),
      providesTags: ["Issuance"],
    }),

    uploadLaptopEvidence: builder.mutation<
      ApiResponse<unknown>,
      { candidateId: string; formData: FormData }
    >({
      query: ({ candidateId, formData }) => ({
        url: `/verify/laptop-issuance/evidence/candidate/${candidateId}`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Issuance"],
    }),

    uploadLaptopReciept: builder.mutation<
      ApiResponse<unknown>,
      { candidateId: string; formData: FormData }
    >({
      query: ({ candidateId, formData }) => ({
        url: `/verify/laptop-issuance/reciept/candidate/${candidateId}`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Issuance"],
    }),

    issueLaptop: builder.mutation<
      ApiResponse<unknown>,
      { candidateId: string; formData: FormData }
    >({
      query: ({ candidateId, formData }) => ({
        url: `/verify/laptop-issuance/candidate/${candidateId}`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["VerificationStatus", "Candidates", "Issuance"],
    }),
    getCandidateByCoupon: builder.query<
      ApiResponse<unknown>,
      { couponCode: string }
    >({
      query: ({ couponCode }) => `/verify/coupon-details/${couponCode}`,
    }),
    getLatestLaptopIssuer: builder.query<ApiResponse<LatestIssuer>, void>({
      query: () => `/verify/latest-issuer`,
      providesTags: ["Issuance"],
    }),

    consolidateVerification: builder.mutation<
      ApiResponse<VerificationResult>,
      FormData
    >({
      query: (payload) => ({
        url: "/verify/canidate-details/consolidate",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["VerificationStatus"],
    }),
    overrideVerification: builder.mutation<
      ApiResponse<OverrideResult>,
      { candidateId: string; payload: OverrideRequest }
    >({
      query: ({ candidateId, payload }) => ({
        url: `/verify/override/${candidateId}`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["VerificationStatus"],
    }),

    proceedWithNoUpgrade: builder.mutation<
      ApiResponse<unknown>,
      { candidateId: string }
    >({
      query: ({ candidateId }) => ({
        url: `/verify/proceed/no-upgrade/${candidateId}`,
        method: "POST",
      }),
    }),

    requestNewUpgrade: builder.mutation<
      ApiResponse<{
        is_already_issued: boolean;
        issuance_info: IssuedStatusWithUpgrade | UpgradeRequestOut;
      }>,
      { candidateId: string; payload: RequestNewUpgrade | null }
    >({
      query: ({ candidateId, payload }) => ({
        url: `/verify/upgrade/request/${candidateId}`,
        method: "POST",
        body: payload,
      }),
    }),

    getUpgradeInfo: builder.query<
      ApiResponse<UpgradeRequestOut>,
      { candidateId: string }
    >({
      query: ({ candidateId }) => `/verify/upgrade-details/${candidateId}`,
    }),

    submitUpgradeRequest: builder.mutation<
      ApiResponse<{
        candidate: CandidateItemWithStore;
        issuance_details: IssuedStatusWithUpgrade;
      }>,
      { candidateId: string; payload: FormData }
    >({
      query: ({ candidateId, payload }) => ({
        url: `/verify/upgrade/submit/${candidateId}`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Issuance"],
    }),

    // ----------------- OLD --------------

    newRequestForUpgrade: builder.mutation<
      ApiResponse<{
        candidate: CandidateItemWithStore;
        issuance_details: IssuedStatusWithUpgrade;
      }>,
      RequestForUploadPayload
    >({
      query: (payload) => ({
        url: `/verify/upgrade-initiate`,
        method: "POST",
        body: payload,
      }),
    }),

    confirmRequestForUpgrade: builder.mutation<
      ApiResponse<{
        candidate: CandidateItemWithStore;
        issuance_details: IssuedStatusWithUpgrade;
      }>,
      RequestForUploadPayload
    >({
      query: (payload) => ({
        url: `/verify/upgrade-confirm`,
        method: "POST",
        body: payload,
      }),
    }),
    confirmUpgrade: builder.mutation<
      ApiResponse<UpgradeRequestPayload>,
      { candidateId: string; payload: UpgradeRequestPayload }
    >({
      query: ({ candidateId, payload }) => ({
        url: `/verify/upgrade-product/${candidateId}`,
        method: "POST",
        body: payload,
      }),
    }),
  }),
});

export const {
  useVerifyFaceMutation,
  useSendOtpMutation,
  useVerifyOtpMutation,
  useVerifyCandidateDetailsMutation,
  useVerifyCouponMutation,
  useAddCouponToCandidateMutation,
  useLazyGetCandidateVerificationStatusQuery,
  useGetCandidateVerificationStatusQuery,
  useVerifyCandidateAadharMutation,
  useIssueLaptopMutation,
  useLazyGetCandidateByCouponQuery,
  useUploadLaptopEvidenceMutation,
  useUploadLaptopRecieptMutation,
  useGetCandidateIssuanceDetailsQuery,
  useConsolidateVerificationMutation,
  useOverrideVerificationMutation,
  useSendOtpToAdminMutation,
  useGetLatestLaptopIssuerQuery,
  useLazyGetCandidateIssuanceDetailsQuery,
  useNewRequestForUpgradeMutation,
  useConfirmUpgradeMutation,
  useConfirmRequestForUpgradeMutation,

  useRequestNewUpgradeMutation,
  useSubmitUpgradeRequestMutation,
  useProceedWithNoUpgradeMutation,
  useGetUpgradeInfoQuery,
} = verificationApi;
