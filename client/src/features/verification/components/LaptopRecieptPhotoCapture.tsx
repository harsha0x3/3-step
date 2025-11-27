// LaptopRecieptPhotoCapture.tsx
import { useUploadLaptopRecieptMutation } from "../store/verificationApiSlice";
import PhotoCaptureSection from "./PhotoCaptureSection";
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

const LaptopRecieptPhotoCapture = ({
  candidateId,
}: {
  candidateId: string;
}) => {
  const [uploadreciept] = useUploadLaptopRecieptMutation();
  const [open, setOpen] = useState<boolean>(false);

  const handleLaptopPhotoSubmit = async (formData: FormData) => {
    return uploadreciept({ candidateId, formData }).unwrap();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Capture Photo</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Capture Reciept/ Bill of the laptop</DialogTitle>
          <DialogDescription>
            Capture the photo of bill or reciept of the laptop.
          </DialogDescription>
        </DialogHeader>
        <PhotoCaptureSection
          candidateId={candidateId}
          onSubmit={handleLaptopPhotoSubmit}
          title="Laptop Reciept Photo"
          successMessage="Laptop reciept photo recorded successfully!"
          submitLabel="Submit reciept Photo"
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default LaptopRecieptPhotoCapture;
