// LaptopPhotoCapture.tsx
import { useUploadLaptopEvidenceMutation } from "../store/verificationApiSlice";
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

const LaptopPhotoCapture = ({ candidateId }: { candidateId: string }) => {
  const [uploadEvidence] = useUploadLaptopEvidenceMutation();

  const handleLaptopPhotoSubmit = async (formData: FormData) => {
    return uploadEvidence({ candidateId, formData }).unwrap();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Capture Photo</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Capture Photo of beneficiary with laptop and reciept.
          </DialogTitle>
          <DialogDescription>
            Capture the photo of beneficiary holding laptop and reciept for
            evidence.
          </DialogDescription>
        </DialogHeader>
        <PhotoCaptureSection
          candidateId={candidateId}
          onSubmit={handleLaptopPhotoSubmit}
          title="Laptop Issuance Photo"
          successMessage="Laptop issuance photo recorded successfully!"
          submitLabel="Submit Laptop issuance Photo"
        />
      </DialogContent>
    </Dialog>
  );
};

export default LaptopPhotoCapture;
