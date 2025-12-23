// src/components/common/PhotoCaptureSection.tsx
import React, { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { compressImage } from "@/utils/imgCompressor";

interface PhotoCaptureSectionProps {
  candidateId?: string;
  onSubmit: (formData: FormData) => Promise<any>; // generic mutation function
  title: string;
  successMessage?: string;
  submitLabel?: string;
  onSuccess?: () => void;
  noCommpression?: boolean;
}

const PhotoCaptureSection: React.FC<PhotoCaptureSectionProps> = ({
  onSubmit,
  submitLabel = "Submit Photo",
  onSuccess,
  noCommpression = false,
}) => {
  const webcamRef = useRef<Webcam | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCam, setSelectedCam] = useState<
    "front_camera" | "rear_camera"
  >("front_camera");
  const [videoConstraints, setVideoConstraints] =
    useState<MediaTrackConstraints>({
      facingMode: "user",
    });

  const capturePhoto = useCallback(() => {
    const imgSrc = webcamRef.current?.getScreenshot();
    if (imgSrc) setPreview(imgSrc);
  }, []);

  const base64ToFile = (base64: string, filename: string) => {
    const arr = base64.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  };

  const handleSubmit = async () => {
    if (!preview) return toast.error("Please capture a photo first");
    let file = base64ToFile(preview, "captured_photo.jpg");
    if (!noCommpression) {
      file = await compressImage(file, 1.5);
    }
    const formData = new FormData();
    formData.append("photo", file);
    try {
      setIsLoading(true);
      await onSubmit(formData);
      // if (successMessage) {
      //   toast.success(successMessage);
      // }
      setPreview(null);
    } catch (err: any) {
      const errMsg: string =
        err?.data?.detail?.msg ?? err?.data?.detail ?? "Error submitting photo";
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
      onSuccess?.();
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-md max-w-md">
      {!preview ? (
        <div className="flex flex-col items-center gap-3">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            className="rounded-lg border max-w-[320px] w-full h-full"
            videoConstraints={videoConstraints}
          />
          <div className="flex justify-between items-center">
            <Button
              variant={selectedCam === "front_camera" ? "outline" : "ghost"}
              onClick={() => {
                setVideoConstraints({ facingMode: "user" });
                setSelectedCam("front_camera");
              }}
            >
              Front Camera
            </Button>
            <Button
              variant={selectedCam === "rear_camera" ? "outline" : "ghost"}
              onClick={() => {
                setVideoConstraints({ facingMode: { exact: "environment" } });
                setSelectedCam("rear_camera");
              }}
            >
              Rear Camera
            </Button>
          </div>
          <Button onClick={capturePhoto}>Capture</Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <img
            src={preview}
            alt="Captured"
            className="rounded-lg border w-[320px] h-72 object-cover"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPreview(null)}
            >
              Retake
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? "Submitting..." : submitLabel}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoCaptureSection;
