// src/features/verification/pages/CandidateVerification.tsx

import React, { useEffect, useState } from "react";
import FacialRecognition from "../components/FacialRecognition";
import OtpVerification from "../components/OtpVerification";
import { useLazyGetCandidateVerificationStatusQuery } from "../store/verificationApiSlice";
import { useLazyGetCandidateByIdQuery } from "@/features/candidates/store/candidatesApiSlice";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import VerifyCoupon from "../components/VerifyCoupon";
import CandidateDetailsSection from "@/features/candidates/components/CandidateDetails";
import { CheckCheckIcon, XCircleIcon } from "lucide-react";
import type { CandidateItemWithStore } from "@/features/candidates/types";
import LaptopIssuanceForm from "../components/LaptopIssuanceForm";

const CandidateVerification: React.FC = () => {
  const [candidate, setCandidate] = useState<CandidateItemWithStore | null>(
    null
  );
  const [candidateId, setCandidateId] = useState<string>("");

  const [
    fetchCandidate,
    { data: candidateDetails, isLoading: loadingCandidateDetails },
  ] = useLazyGetCandidateByIdQuery();

  const [
    fetchVerificationStatus,
    { data: candidateVerificationStatus, isLoading },
  ] = useLazyGetCandidateVerificationStatusQuery();

  const getCandidate = async () => {
    try {
      // Get the candidate directly from the response
      const result = await fetchCandidate(candidateId).unwrap();
      setCandidate(result?.data?.candidate);

      const candidateIdFromResult = result?.data?.candidate?.id;

      if (candidateIdFromResult) {
        await fetchVerificationStatus(candidateIdFromResult);
      } else {
        toast.error("Candidate not found");
      }
    } catch (err: any) {
      const errMsg: string =
        err?.data?.detail?.msg ?? err?.data?.detail ?? "Error verifying face";

      const errDesc = err?.data?.detail?.msg
        ? err?.data?.detail?.err_stack
        : "";
      toast.error(errMsg, { description: errDesc });
    }
  };

  useEffect(() => {
    console.log("CANDIDATE DETAILS", candidateDetails);
  }, [candidateDetails]);

  const getCandidateVerificationStatus = async () => {
    try {
      if (candidateDetails) {
        // Then trigger the second query
        await fetchVerificationStatus(candidate?.id);
      } else {
        toast.error("Candidate not found");
      }
    } catch (err: any) {
      const errMsg: string =
        err?.data?.detail?.msg ?? err?.data?.detail ?? "Error verifying face";

      const errDesc = err?.data?.detail?.msg
        ? err?.data?.detail?.err_stack
        : "";
      toast.error(errMsg, { description: errDesc });
    }
  };

  const renderVerificationStep = () => {
    const status = candidateVerificationStatus?.data;

    if (!status) return null;

    switch (true) {
      case status.is_facial_verified === false:
        return <FacialRecognition candidateId={candidate?.id} />;

      case status.is_otp_verified === false:
        return <OtpVerification candidateId={candidate?.id} />;

      case status.is_coupon_verified === false:
        return <VerifyCoupon candidateId={candidate?.id} />;

      case status.is_facial_verified &&
        status.is_otp_verified &&
        status.is_coupon_verified:
        return <LaptopIssuanceForm candidateId={candidate?.id} />;

      default:
        return <div>Error Refresh The page</div>;
    }
  };

  if (candidate && candidate.issued_status === "issued") {
    return <div>Candidate already recieved the laptop</div>;
  }

  return (
    <div className="w-full mt-3 space-y-6">
      <div className="flex justify-between items-center px-2">
        <div className="flex gap-3 items-center">
          <h1 className="text-2xl font-bold text-center ">
            Laptop Issuance Verification
          </h1>
          <Button
            onClick={() => {
              setCandidate(null);
              setCandidateId("");
            }}
          >
            Verify new Candidate
          </Button>
        </div>
        {candidateVerificationStatus && (
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
              <div className="flex gap-1 border rounded-md px-2 py-1">
                {candidateVerificationStatus?.data?.is_coupon_verified ? (
                  <CheckCheckIcon className="text-green-600" />
                ) : (
                  <XCircleIcon className="text-red-600" />
                )}
                <span>Coupon Verification</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 w-full items-center justify-center">
        <div>
          {candidateDetails && candidate && (
            <div className="h-[500px] w-[600px] overflow-auto">
              <CandidateDetailsSection candidate={candidate} />
            </div>
          )}
        </div>
        <div>
          {!candidate && (
            <div className="flex flex-col gap-2">
              <Label>Canididate Id</Label>
              <Input
                type="text"
                value={candidateId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setCandidateId(e.target.value);
                }}
              />
              <Button
                onClick={getCandidate}
                className="mt-2"
                disabled={candidateId.trim() === ""}
              >
                Get Cadidate
              </Button>
            </div>
          )}
        </div>

        {candidate && renderVerificationStep()}
      </div>
    </div>
  );
};

export default CandidateVerification;
