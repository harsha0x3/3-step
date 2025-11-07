// src/features/verification/components/VerifyCandidateDetails.tsx

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import React from "react";

const VerifyCandidateDetails: React.FC = () => {
  const [open, setOpen] = React.useState<boolean>(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={"sm"} variant={"secondary"}>
          Verify Candidate
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader></DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default VerifyCandidateDetails;
