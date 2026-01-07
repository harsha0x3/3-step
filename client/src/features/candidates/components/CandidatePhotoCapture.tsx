// LaptopPhotoCapture.tsx
import React, { useState } from "react";
import PhotoCaptureSection from "@/features/verification/components/PhotoCaptureSection";
import { useUploadCandidatePhotoMutation } from "../store/candidatesApiSlice";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";

const CandidatePhotoCapture = ({ candidateId }: { candidateId: string }) => {
  const [uploadPhoto, { isLoading }] = useUploadCandidatePhotoMutation();
  const [open, setOpen] = useState<boolean>(false);
  const handleImageUpload = async (formData: FormData) => {
    try {
      await uploadPhoto({
        candidateId: candidateId,
        formData,
      }).unwrap();
      setOpen(false);
    } catch (err: any) {
      const errMsg = err?.data?.detail ?? "Photo upload failed. Try again";
      toast.error(errMsg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center gap-2 ">
              <Loader
                className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
              />
              Uploading...
            </span>
          ) : (
            "Capture Photo"
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center">
            Capture benificiary employees photo
          </DialogTitle>
          <DialogDescription>
            Capture the photo with proper lighting and background since, this
            picture is going to be used for facial recognition authentication of
            the person.
          </DialogDescription>
        </DialogHeader>
        <PhotoCaptureSection
          candidateId={candidateId}
          onSubmit={handleImageUpload}
          title="Benificiary photo"
          successMessage="Photo uploaded successfully!"
          submitLabel="Submit Photo"
          onSuccess={() => setOpen(false)}
          noCommpression={true}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CandidatePhotoCapture;
