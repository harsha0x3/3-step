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

const VendorSpocPhotoCapture = ({ onSubmit }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Capture Photo</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Capture Photo of vendor spoc.</DialogTitle>
          <DialogDescription>
            Vendor spoc person is accountable for the integrity of the
            beneficiary employee.
          </DialogDescription>
        </DialogHeader>
        <PhotoCaptureSection
          onSubmit={onSubmit}
          title="Vendor Spoc Photo"
          successMessage="Vendor Spoc Photo recorded successfully!"
          submitLabel="Submit Vendor Spoc Photo"
        />
      </DialogContent>
    </Dialog>
  );
};

export default VendorSpocPhotoCapture;
