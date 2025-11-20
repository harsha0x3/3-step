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

const CandidatePhotoCapture = ({ candidateId }: { candidateId: string }) => {
  const [uploadPhoto] = useUploadCandidatePhotoMutation();
  const [open, setOpen] = useState<boolean>(false);
  const handleImageUpload = async (formData: FormData) => {
    try {
      await uploadPhoto({
        candidateId: candidateId,
        formData,
      }).unwrap();
      toast.success(`${"candidate"} photo uploaded successfully`);
      setOpen(false);
    } catch (err: any) {
      toast.error("Photo upload failed", {
        description: err?.data?.detail?.err_stack ?? "",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Capture Photo</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Capture benificiary employees photo</DialogTitle>
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
        />
      </DialogContent>
    </Dialog>
  );
};

export default CandidatePhotoCapture;
