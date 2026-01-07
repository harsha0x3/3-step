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
import { Loader } from "lucide-react";

const AadharPhotoCapture = ({ candidateId }: { candidateId: string }) => {
  const [addAadharPhoto, { isLoading }] = useAddCandidateAadharMutation();
  const [open, setOpen] = useState<boolean>(false);
  const handleImageUpload = async (formData: FormData) => {
    try {
      await addAadharPhoto({
        candidateId: candidateId,
        formData,
      }).unwrap();
      toast.success(`photo uploaded successfully`);
    } catch (err: any) {
      toast.error("Photo upload failed", {
        description: err?.data?.detail?.err_stack ?? "",
      });
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
          <DialogTitle>
            Capture benificiary employee's Aadhaar Photo
          </DialogTitle>
          <DialogDescription>
            Capture the photo with proper lighting and background since, this
            picture is going to be used by system to fetch the aadhaar number.
          </DialogDescription>
        </DialogHeader>
        <PhotoCaptureSection
          candidateId={candidateId}
          onSubmit={handleImageUpload}
          title="Aadhaar photo of Benificiary Employee"
          successMessage="Photo uploaded successfully!"
          submitLabel="Submit Photo"
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AadharPhotoCapture;
