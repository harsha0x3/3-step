// EvidenceCaptures.tsx
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

const EvidenceCaptures = ({
  dialogTitle,
  dialogDesc,
  onSubmit,
}: {
  dialogTitle?: string;
  dialogDesc?: string;
  onSubmit: (any) => any;
}) => {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Capture Photo</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {dialogTitle ? dialogTitle : "Capture the Photo"}
          </DialogTitle>
          <DialogDescription>{dialogDesc ? dialogDesc : ""}</DialogDescription>
        </DialogHeader>
        <PhotoCaptureSection
          onSubmit={onSubmit}
          title="Laptop Issuance Photo"
          successMessage="Laptop issuance photo recorded successfully!"
          submitLabel="Submit"
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EvidenceCaptures;
