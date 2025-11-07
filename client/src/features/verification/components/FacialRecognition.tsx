// src/features/product_stores/components/FacialRecognition.tsx

import React, { useCallback, useRef, useState } from "react";
import { useVerifyFaceMutation } from "../store/verificationApiSlice";
import { toast } from "sonner";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";

interface FacialRecognitionProps {
  candidateId: string;
}

const FacialRecognition: React.FC<FacialRecognitionProps> = ({
  candidateId,
}) => {
  const webcamRef = useRef<Webcam | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [verifyFace, { isLoading, error }] = useVerifyFaceMutation();

  const capturePhoto = useCallback(() => {
    const imgSrc = webcamRef.current?.getScreenshot();
    if (imgSrc) setPreview(imgSrc);
  }, [webcamRef]);

  const base64ToFile = (base64: string, filename: string) => {
    const arr = base64.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  };

  const handleVerify = async () => {
    if (!preview) return toast.error("Please capture a photo first");

    const file = base64ToFile(preview, "captured_face.jpg");
    const formData = new FormData();
    formData.append("photo", file);

    try {
      await verifyFace({ candidateId, formData }).unwrap();
      toast.success("Face verified successfully");
    } catch (err) {
      console.error("THe error in facial Recog", err);

      const errMsg: string =
        err?.data?.detail?.msg ?? err?.data?.detail ?? "Error verifying face";

      const errDesc = err?.data?.detail?.msg
        ? err?.data?.detail?.err_stack
        : "";
      toast.error(errMsg, { description: errDesc });
    }
  };
  return (
    <div className="flex flex-col gap-4 p-4 border rounded-md">
      <h2 className="text-xl font-semibold">Face Verification</h2>
      {!preview ? (
        <div className="flex flex-col items-center gap-3">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            width={320}
            height={240}
            className="rounded-lg border"
            videoConstraints={{ facingMode: "user" }}
          />
          <Button type="button" onClick={capturePhoto}>
            Capture Photo
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <img
            src={preview}
            alt="Captured face"
            className="rounded-lg border w-[320px] h-60 object-cover"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPreview(null)}
            >
              Retake
            </Button>
            <Button type="button" onClick={handleVerify} disabled={isLoading}>
              {isLoading ? "Verifying..." : "Verify Face"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacialRecognition;
