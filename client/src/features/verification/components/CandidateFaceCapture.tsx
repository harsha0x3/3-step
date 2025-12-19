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

const CandidateFaceCapture = ({
  onSubmit,
  triggerTitle,
}: {
  onSubmit: (formData: FormData) => Promise<any>;
  triggerTitle?: string;
}) => {
  const [open, setOpen] = useState<boolean>(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={"outline"}>{triggerTitle ?? "Capture Photo"}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center">Facial Recognition</DialogTitle>
          <DialogDescription className="text-center">
            Capture Photo Beneficiary
          </DialogDescription>
        </DialogHeader>
        <PhotoCaptureSection
          onSubmit={onSubmit}
          title="Facial Recognition"
          successMessage="Photo Captured successfully"
          submitLabel="Submit photo"
          onSuccess={() => setOpen(false)}
          noCommpression={true}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CandidateFaceCapture;
