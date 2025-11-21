import React from "react";
import { Button } from "@/components/ui/button";
import type { CandidateItemWithStore } from "@/features/candidates/types";

interface IssuanceSuccessProps {
  candidate: CandidateItemWithStore; // CandidateItemWithStore type if you prefer strict typing
  issuanceDetails: {
    evidence_photo: string | null;
    bill_reciept: string | null;
  };
  onVerifyNext: () => void;
}

const LaptopIssuanceSuccess: React.FC<IssuanceSuccessProps> = ({
  candidate,
  issuanceDetails,
  onVerifyNext,
}) => {
  const baseUrl = import.meta.env.VITE_API_BASE_API_URL;

  return (
    <div className="w-full mx-auto mt-6 p-6 flex flex-col gap-6 border rounded-md">
      <h1 className="text-2xl font-bold text-green-600 text-center">
        🎉 Laptop Issuance Complete!
      </h1>

      {/* Candidate Details */}
      <div className="border rounded p-4">
        <h2 className="text-lg font-semibold mb-2">Candidate Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-700 text-sm">
          <p>
            <strong>Employee Id: </strong>
            {candidate.id}
          </p>
          <p>
            <strong>Name:</strong> {candidate.full_name}
          </p>

          <p>
            <strong>Phone:</strong> {candidate.mobile_number}
          </p>
          <p>
            <strong>Voucher Code:</strong> {candidate.coupon_code}
          </p>

          <p>
            <strong>State:</strong> {candidate.state}
          </p>
          <p>
            <strong>City:</strong> {candidate.city}
          </p>
          <p>
            <strong>Store:</strong> {candidate.store?.name}
          </p>
        </div>
      </div>

      {/* Photos Section */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="border p-3 flex flex-col items-center rounded">
          <h3 className="font-medium mb-2">Candidate Receiving Laptop</h3>
          {issuanceDetails.evidence_photo ? (
            <img
              src={`${baseUrl}/hard_verify/api/v1.0/uploads/${issuanceDetails.evidence_photo}`}
              alt="candidate holding laptop"
              className="w-64 h-64 object-cover rounded border"
            />
          ) : (
            <p className="text-gray-500">No Photo Available</p>
          )}
        </div>

        <div className="border p-3 flex flex-col items-center rounded">
          <h3 className="font-medium mb-2">Bill / Receipt Proof</h3>
          {issuanceDetails.bill_reciept ? (
            <img
              src={`${baseUrl}/hard_verify/api/v1.0/uploads/${issuanceDetails.bill_reciept}`}
              alt="receipt"
              className="w-64 h-64 object-cover rounded border"
            />
          ) : (
            <p className="text-gray-500">No Receipt Photo Available</p>
          )}
        </div>
      </div>

      {/* Button */}
      <div className="flex justify-center mt-4">
        <Button onClick={onVerifyNext}>Verify Next Candidate</Button>
      </div>
    </div>
  );
};

export default LaptopIssuanceSuccess;
