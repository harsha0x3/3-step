import PhotoCaptureSection from "@/features/verification/components/PhotoCaptureSection";
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

const VendorSpocPhotoCapture = ({ onSubmit }) => {
  const [open, setOpen] = useState<boolean>(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Capture Photo</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center">
            Capture Photo of Vendor Contact Person
          </DialogTitle>
          <DialogDescription>
            Vendor contact person is responsible for identifying the
            beneficiary.
          </DialogDescription>
        </DialogHeader>
        <PhotoCaptureSection
          onSubmit={onSubmit}
          title="Vendor Spoc Photo"
          successMessage="Vendor Spoc Photo recorded successfully!"
          submitLabel="Submit Vendor Spoc Photo"
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default VendorSpocPhotoCapture;
