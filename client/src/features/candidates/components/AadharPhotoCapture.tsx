// AadharPhotoCapture.tsx
import PhotoCaptureSection from "@/features/verification/components/PhotoCaptureSection";
import { useAddCandidateAadharMutation } from "../store/candidatesApiSlice";
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
import { useState } from "react";

const AadharPhotoCapture = ({ candidateId }: { candidateId: string }) => {
  const [addAadharPhoto] = useAddCandidateAadharMutation();
  const [open, setOpen] = useState<boolean>(false);
  const handleImageUpload = async (formData: FormData) => {
    try {
      await addAadharPhoto({
        candidateId: candidateId,
        formData,
      }).unwrap();
      toast.success(`${"candidate"} photo uploaded successfully`);
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
          <DialogTitle>Capture benificiary employee's Aadhar Photo</DialogTitle>
          <DialogDescription>
            Capture the photo with proper lighting and background since, this
            picture is going to be used by system to fetch the aadhar number.
          </DialogDescription>
        </DialogHeader>
        <PhotoCaptureSection
          candidateId={candidateId}
          onSubmit={handleImageUpload}
          title="Aadhar photo of Benificiary Employee"
          successMessage="Photo uploaded successfully!"
          submitLabel="Submit Photo"
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AadharPhotoCapture;
