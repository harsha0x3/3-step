// src/features/verification/pages/CandidateVerification.tsx

import React, { useEffect, useState } from "react";
import FacialRecognition from "../components/FacialRecognition";
import OtpVerification from "./OtpVerification";
import {
  useGetCandidateIssuanceDetailsQuery,
  useLazyGetCandidateByCouponQuery,
  useLazyGetCandidateVerificationStatusQuery,
} from "../store/verificationApiSlice";
// import { useLazyGetCandidateByIdQuery } from "@/features/candidates/store/candidatesApiSlice";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import CandidateDetailsSection from "@/features/candidates/components/CandidateDetails";
import { CheckCheckIcon, XCircleIcon } from "lucide-react";
import type { CandidateItemWithStore } from "@/features/candidates/types";
import LaptopIssuanceForm from "../components/LaptopIssuanceForm";
import { useSearchParams } from "react-router-dom";
import LaptopIssuanceSuccess from "../components/IssuanceDetails";

const CandidateVerification: React.FC = () => {
  const [candidate, setCandidate] = useState<CandidateItemWithStore | null>(
    null
  );
  const [couponCode, setCouponCode] = useState<string>("");

  const [searchParams, setSearchParams] = useSearchParams();

  const couponCodeParam = searchParams.get("coupon") || "";
  const step = searchParams.get("step") || "start";

  // const [
  //   fetchCandidate,
  //   { data: candidateDetails_, isLoading: loadingCandidateDetails },
  // ] = useLazyGetCandidateByIdQuery();

  const [
    fetchCandidateByCoupon,
    { data: candidateDetails, isLoading: loadingCandidateDetails },
  ] = useLazyGetCandidateByCouponQuery();
  const [
    fetchVerificationStatus,
    { data: candidateVerificationStatus, isLoading },
  ] = useLazyGetCandidateVerificationStatusQuery();

  const { data: issuancedetails, isLoading: isLoadingIssuanceDetails } =
    useGetCandidateIssuanceDetailsQuery(candidate?.id, { skip: !candidate });

  const backendStep = (status: any): string => {
    console.log("RECIVED STATUS", status);
    if (!status.is_facial_verified) return "facial";
    if (status.is_facial_verified && !status.is_otp_verified) return "otp";
    if (status.is_facial_verified && status.is_otp_verified) return "issue";
    return "details";
  };

  useEffect(() => {
    if (!couponCodeParam) return;

    const fetchCandidate = async () => {
      try {
        const result = await fetchCandidateByCoupon({
          couponCode: couponCodeParam,
        }).unwrap();
        const cand = result?.data?.candidate;

        if (!cand) {
          toast.error("Candidate not found");
          return;
        }

        setCandidate(cand);
        await fetchVerificationStatus(cand.id).unwrap();

        // sync URL to backend truth
        setSearchParams({ coupon: couponCodeParam, step: "details" });
      } catch (err: any) {
        toast.error(
          err?.data?.detail?.msg ??
            err?.data?.detail ??
            "Failed to fetch candidate"
        );
      }
    };

    fetchCandidate();
  }, [couponCodeParam]);

  const handleSubmitCoupon = () => {
    setSearchParams({ coupon: couponCode, step: "fetching" });
  };

  useEffect(() => {
    console.log("CANDIDATE DETAILS", candidateDetails);
  }, [candidateDetails]);

  const renderStepComponent = () => {
    if (!candidate) return null;

    switch (step) {
      case "facial":
        return (
          <FacialRecognition
            candidateId={candidate.id}
            onSuccess={handleStepCompleted}
          />
        );

      case "otp":
        return (
          <OtpVerification
            candidateId={candidate.id}
            onSuccess={handleStepCompleted}
          />
        );

      case "issue":
        return (
          <LaptopIssuanceForm
            candidateId={candidate.id}
            onSuccess={() => setSearchParams({ step: "success" })}
          />
        );
      case "success":
        return (
          <LaptopIssuanceSuccess
            candidate={candidate}
            issuanceDetails={issuancedetails}
            onVerifyNext={resetFlow}
          />
        );

      default:
        return null;
    }
  };

  const handleStepCompleted = async () => {
    if (!candidate) {
      console.log("CANDIDATE NOT FOUND");
      return;
    }

    console.log("INSIDE ONSUCCESS()");
    const status = await fetchVerificationStatus(candidate.id).unwrap();
    const nextStep = backendStep(status.data);

    setSearchParams({ coupon: couponCodeParam, step: nextStep });
  };

  const resetFlow = () => {
    setSearchParams({});
    setCandidate(null);
    setCouponCode("");
  };

  useEffect(() => {
    if (
      candidate &&
      candidate.issued_status === "issued" &&
      step !== "success"
    ) {
      setSearchParams({ coupon: couponCodeParam, step: "success" });
    }
  }, [candidate, step]);

  return (
    <div className="w-full mt-3 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center px-2">
        <div className="flex gap-3 items-center">
          <h1 className="text-2xl font-bold text-center ">
            Laptop Distribution
          </h1>
          <Button
            onClick={() => {
              resetFlow();
            }}
          >
            Distribute New
          </Button>
        </div>
        {candidate && candidateVerificationStatus && (
          <div className="flex gap-2 items-center">
            <h2>Status: </h2>
            <div className="flex gap-1">
              <div className="flex gap-1 border rounded-md px-2 py-1">
                {candidateVerificationStatus?.data?.is_facial_verified ? (
                  <CheckCheckIcon className="text-green-600" />
                ) : (
                  <XCircleIcon className="text-red-600" />
                )}
                <span>Facial Verification</span>
              </div>
              <div className="flex gap-1 border rounded-md px-2 py-1">
                {candidateVerificationStatus?.data?.is_otp_verified ? (
                  <CheckCheckIcon className="text-green-600" />
                ) : (
                  <XCircleIcon className="text-red-600" />
                )}
                <span>OTP Verification</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-2 w-full items-center justify-center">
        {/* Step rendering */}
        {step !== "details" && candidate && renderStepComponent()}

        {/* Candidate Details */}
        <div className="w-full">
          {candidateDetails && candidate && step !== "success" && (
            <div className="flex flex-col md:flex-row md:items-end md:gap-3">
              <CandidateDetailsSection candidate={candidate} />

              {step === "details" && (
                <Button
                  className="mt-4"
                  onClick={async () => {
                    const status = await fetchVerificationStatus(
                      candidate.id
                    ).unwrap();
                    const nextStep = backendStep(status.data);
                    console.log("🍜🍜", nextStep);
                    setSearchParams({
                      coupon: couponCodeParam,
                      step: nextStep,
                    });
                  }}
                >
                  Proceed to Verification
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div>
        {!candidate && (
          <div className="flex flex-col gap-2 w-1/2">
            <Label>Enter Coupon Code</Label>
            <Input
              type="text"
              placeholder="Candidate's Coupon Code"
              value={couponCode}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setCouponCode(e.target.value);
              }}
            />
            <Button
              onClick={handleSubmitCoupon}
              className="mt-2"
              disabled={couponCode.trim() === ""}
            >
              Get Cadidate
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateVerification;
