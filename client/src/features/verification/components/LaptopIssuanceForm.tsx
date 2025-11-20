import React, { useState } from "react";
import {
  useGetCandidateIssuanceDetailsQuery,
  useIssueLaptopMutation,
  useUploadLaptopEvidenceMutation,
  useUploadLaptopRecieptMutation,
} from "../store/verificationApiSlice";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import LaptopPhotoCapture from "./LaptopPhotoCapture";
import LaptopRecieptPhotoCapture from "./LaptopRecieptPhotoCapture";
import { Loader } from "lucide-react";

interface LaptopIssuanceFormProps {
  candidateId: string;
  onSuccess?: () => void;
}

const LaptopIssuanceForm: React.FC<LaptopIssuanceFormProps> = ({
  candidateId,
  onSuccess,
}) => {
  const [laptopSerial, setLaptopSerial] = useState("");
  const [issueLaptop, { isLoading }] = useIssueLaptopMutation();
  const [uploadEvidence, { isLoading: isUploadingEvidence }] =
    useUploadLaptopEvidenceMutation();
  const [uploadreciept, { isLoading: isUploadingReciept }] =
    useUploadLaptopRecieptMutation();

  const { data: issuancedetails, isLoading: isLoadingIssuanceDetails } =
    useGetCandidateIssuanceDetailsQuery(candidateId, { skip: !candidateId });

  const handleEvidenceFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("photo", file);
    try {
      await uploadEvidence({
        candidateId: candidateId,
        formData: formData,
      }).unwrap();
    } catch (err) {
      const errMsg: string =
        err?.data?.detail?.msg ??
        err?.data?.detail ??
        "Error Uploading the evidence of Issuance of laptop.";

      const errDesc = err?.data?.detail?.msg
        ? err?.data?.detail?.err_stack
        : "";
      toast.error(errMsg, { description: errDesc });
    }
  };
  const baseUrl = import.meta.env.VITE_API_BASE_API_URL;
  const handleRecieptFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("photo", file);
    try {
      await uploadreciept({
        candidateId: candidateId,
        formData: formData,
      }).unwrap();
    } catch (err) {
      const errMsg: string =
        err?.data?.detail?.msg ??
        err?.data?.detail ??
        "Error Uploading the evidence of Issuance of laptop.";

      const errDesc = err?.data?.detail?.msg
        ? err?.data?.detail?.err_stack
        : "";
      toast.error(errMsg, { description: errDesc });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!laptopSerial) {
      alert("Please provide both the laptop serial and photo.");
      return;
    }

    const formData = new FormData();
    formData.append("laptop_serial", laptopSerial);

    try {
      await issueLaptop({ candidateId, formData }).unwrap();
      toast.success("Laptop issuance recorded successfully!");
      setLaptopSerial("");
      onSuccess?.();
    } catch (err) {
      const errMsg: string =
        err?.data?.detail?.msg ??
        err?.data?.detail ??
        "Error Registring the Issuance of laptop.";

      const errDesc = err?.data?.detail?.msg
        ? err?.data?.detail?.err_stack
        : "";
      toast.error(errMsg, { description: errDesc });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-md sm:w-xl md:w-2xl border p-2 flex flex-col gap-5"
    >
      <h2 className="font-semibold text-lg">Laptop Issuance</h2>

      <div className="my-2">
        <Label htmlFor="laptopSerial">Laptop Serial:</Label>
        <Input
          type="text"
          id="laptopSerial"
          value={laptopSerial}
          onChange={(e) => setLaptopSerial(e.target.value)}
          required
          style={{ display: "block", width: "100%", padding: "0.5rem" }}
        />
      </div>

      <div className="flex flex-col gap-2 relative border p-2">
        <p className="absolute -translate-y-5 bg-background rounded px-2">
          Upload or capture photo of beneficiary holding the laptop
        </p>
        <div className="my-2">
          <Label htmlFor="evidencePhoto">Upload Photo:</Label>
          <Input
            type="file"
            id="evidencePhoto"
            accept="image/*"
            onChange={handleEvidenceFileChange}
            style={{ display: "block", width: "100%" }}
          />
        </div>
        <p className="fomt-medium">{`(OR)`}</p>
        <div className="my-1 flex justify-between items-center">
          <div>
            <Label htmlFor="evidencePhoto">Capture Photo:</Label>
            <LaptopPhotoCapture candidateId={candidateId} />
          </div>
          {issuancedetails?.evidence_photo ? (
            <img
              src={`${baseUrl}/hard_verify/api/v1.0/uploads/${issuancedetails.evidence_photo}`}
              alt="Candidate"
              className="w-28 h-28 object-cover rounded-md border mt-1"
            />
          ) : (
            <div className="w-28 h-28 border rounded-md flex items-center justify-center text-gray-400 mt-1">
              {isLoadingIssuanceDetails || isUploadingEvidence ? (
                <div>
                  <Loader className="w-5 h-5 animate-spin" /> Loading photo...
                </div>
              ) : (
                "No Photo"
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 relative border p-2">
        <p className="absolute -translate-y-5 bg-background rounded px-2">
          Upload or capture photo of bill or reciept ensuring the issuance of
          laptop.
        </p>
        <div className="my-2">
          <Label htmlFor="photo">Upload Photo:</Label>
          <Input
            type="file"
            id="photo"
            accept="image/*"
            onChange={handleRecieptFileChange}
            style={{ display: "block", width: "100%" }}
          />
        </div>
        <p className="fomt-medium">{`(OR)`}</p>
        <div className="my-1 flex justify-between items-center">
          <div>
            <Label htmlFor="photo">Capture Photo:</Label>
            <LaptopRecieptPhotoCapture candidateId={candidateId} />
          </div>
          {issuancedetails?.bill_reciept ? (
            <img
              src={`${baseUrl}/hard_verify/api/v1.0/uploads/${issuancedetails.bill_reciept}`}
              alt="Candidate"
              className="w-28 h-28 object-cover rounded-md border mt-1"
            />
          ) : (
            <div className="w-28 h-28 border rounded-md flex items-center justify-center text-gray-400 mt-1">
              {isLoadingIssuanceDetails || isUploadingReciept ? (
                <div>
                  <Loader className="w-5 h-5 animate-spin" /> Loading photo...
                </div>
              ) : (
                "No Photo"
              )}
            </div>
          )}
        </div>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Submitting..." : "Submit"}
      </Button>
    </form>
  );
};

export default LaptopIssuanceForm;
