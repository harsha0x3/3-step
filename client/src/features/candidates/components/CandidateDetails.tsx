// src/features/candidates/components/CandidateDetailsSection.tsx

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { CandidateItemWithStore } from "../types";

type Props = {
  candidate: CandidateItemWithStore;
};

const CandidateDetailsSection: React.FC<Props> = ({ candidate }) => {
  const baseUrl = import.meta.env.VITE_API_BASE_API_URL;

  return (
    <div
      className="border rounded-md shadow-sm space-y-6 w-[95vw] max-w-[500px] sm:max-w-[600px] 
                          h-[90vh] sm:h-[80vh] overflow-auto 
                          mx-auto px-2 py-4"
    >
      <h2 className="text-xl font-semibold text-center mb-4">
        Beneficiary Details
      </h2>

      {/* Candidate Info */}
      <section className="grid grid-cols-1 gap-3">
        <div>
          <Label>Full Name</Label>
          <Input value={candidate.full_name ?? ""} readOnly />
        </div>

        <div>
          <Label>Mobile Number</Label>
          <Input value={candidate.mobile_number ?? ""} readOnly />
        </div>

        <div>
          <Label>City</Label>
          <Input value={candidate.city ?? ""} readOnly />
        </div>

        <div>
          <Label>State</Label>
          <Input value={candidate.state ?? ""} readOnly />
        </div>
        <div>
          <Label>Date of Birth</Label>
          <Input value={candidate.dob ?? ""} readOnly />
        </div>

        <div>
          <Label>Store Name</Label>
          <Input value={candidate.store?.name ?? ""} readOnly />
        </div>
      </section>

      {/* Parent Info */}
      {/* <section className="mt-6">
        <h3 className="font-semibold text-lg mb-2">Vemdor Details</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Parent Name</Label>
            <Input value={candidate.parent_name ?? ""} readOnly />
          </div>
          <div>
            <Label>Parent Employee Code</Label>
            <Input value={candidate.parent_employee_code ?? ""} readOnly />
          </div>
          <div>
            <Label>Relation</Label>
            <Input value={candidate.parent_relation ?? ""} readOnly />
          </div>
          <div>
            <Label>Parent Mobile Number</Label>
            <Input value={candidate.parent_mobile_number ?? ""} readOnly />
          </div>
          <div>
            <Label>Parent Email</Label>
            <Input value={candidate.parent_email ?? ""} readOnly />
          </div>
        </div>
      </section> */}

      {/* Photos */}
      <section className="mt-6">
        <h3 className="font-semibold text-lg mb-2">Photos</h3>
        <div className="flex gap-8">
          {/* Candidate Photo */}
          <div className="flex flex-col items-center">
            <Label>Candidate Photo</Label>
            {candidate.photo ? (
              <img
                src={`${baseUrl}/hard_verify/api/v1.0/secured_file?path=${encodeURIComponent(
                  candidate.photo
                )}`}
                alt="Candidate"
                className="w-24 h-24 object-cover rounded-md border mt-1"
              />
            ) : (
              <div className="w-24 h-24 border rounded-md flex items-center justify-center text-gray-400 mt-1">
                No Photo
              </div>
            )}
          </div>

          {/* Parent Photo */}
          {/* <div className="flex flex-col items-center">
            <Label>Parent Photo</Label>
            {candidate.parent_photo_url ? (
              <img
                src={`${baseUrl}/hard_verify/api/v1.0/uploads/${candidate.parent_photo_url}`}
                alt="Parent"
                className="w-24 h-24 object-cover rounded-md border mt-1"
              />
            ) : (
              <div className="w-24 h-24 border rounded-md flex items-center justify-center text-gray-400 mt-1">
                No Photo
              </div>
            )}
          </div> */}
        </div>
      </section>
    </div>
  );
};

export default CandidateDetailsSection;
