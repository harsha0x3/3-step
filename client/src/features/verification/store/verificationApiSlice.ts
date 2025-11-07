import { rootApiSlice } from "@/store/rootApiSlice";
import type { ApiResponse } from "@/store/rootTypes";

export const verificationApi = rootApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    verifyFace: builder.mutation<
      any,
      { candidateId: string; formData: FormData }
    >({
      query: ({ candidateId, formData }) => ({
        url: `/verify/find-candidate/face/${candidateId}`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["VerificationStatus"],
    }),
    sendOtp: builder.mutation({
      query: (candidateId: string) => ({
        url: `/verify/otp/re-send/candidate/${candidateId}`,
        method: "POST",
      }),
    }),
    verifyOtp: builder.mutation({
      query: ({ candidateId, otp }: { candidateId: string; otp: string }) => ({
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
    getCandidateVerificationStatus: builder.query({
      query: (candidateId: string) => ({
        url: `/verify/status/candidate/${candidateId}`,
        method: "GET",
      }),
      providesTags: ["VerificationStatus"],
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
  useVerifyCandidateAadharMutation,
  useIssueLaptopMutation,
} = verificationApi;
