// FacialRecognition.tsx
import React from "react";
import { useVerifyFaceMutation } from "../store/verificationApiSlice";
import PhotoCaptureSection from "./PhotoCaptureSection";
import { toast } from "sonner";

interface props {
  candidateId: string;
  onSuccess?: () => void;
}

const FacialRecognition: React.FC<props> = ({ candidateId, onSuccess }) => {
  const [verifyFace] = useVerifyFaceMutation();

  const handleFaceSubmit = async (formData: FormData) => {
    try {
      await verifyFace({ candidateId, formData }).unwrap();
      toast.success("Facial recognition completed successfully.");
      onSuccess?.();
    } catch (err) {
      const errMsg: string =
        err?.data?.detail?.msg ??
        err?.data?.detail ??
        "Error in facial recognition";

      const errDesc = err?.data?.detail?.msg
        ? err?.data?.detail?.err_stack
        : "";
      toast.error(errMsg, { description: errDesc });
    }
  };

  return (
    <PhotoCaptureSection
      candidateId={candidateId}
      onSubmit={handleFaceSubmit}
      title="Facial Verification"
      submitLabel="Verify Face"
    />
  );
};

export default FacialRecognition;
