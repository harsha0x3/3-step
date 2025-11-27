import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import React, { lazy, Suspense, useState } from "react";
import type { CandidateItemWithStore } from "../types";
import { Loader } from "lucide-react";
import { useGetCandidateByIdQuery } from "../store/candidatesApiSlice";

interface IssuanceDetailsDialogProps {
  candidate?: CandidateItemWithStore;
  candidateId?: string;
}

const IssuanceDetailsDialog: React.FC<IssuanceDetailsDialogProps> = ({
  candidate,
  candidateId,
}) => {
  const IssuanceDetails = lazy(
    () => import("@/features/verification/components/IssuanceDetails")
  );
  const [open, setOpen] = useState<boolean>(false);
  const { data, isLoading, isError } = useGetCandidateByIdQuery(candidateId!, {
    skip: !!candidate && !candidateId,
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={"link"} size={"sm"}>
          View
        </Button>
      </DialogTrigger>
      <DialogContent
        className="w-[95vw] max-w-[600px] sm:max-w-[600px] 
                          h-[90vh] sm:h-[90vh] overflow-hidden 
                          mx-auto flex flex-col gap-6"
      >
        <DialogHeader>
          <DialogTitle className="text-center">
            Laptop Issuance Details
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="text-lg">
              <p>Loading Beneficiary Data...</p>
              <Loader className="animate-spin w-9 h-9" />
            </div>
          ) : isError ? (
            <div>
              <p>Error Getting Beneficiary Data</p>
            </div>
          ) : candidate || data?.data ? (
            <Suspense
              fallback={
                <div className="text-lg">
                  <p>Loading...</p>
                  <Loader className="animate-spin w-9 h-9" />
                </div>
              }
            >
              <IssuanceDetails candidate={candidate ?? data?.data} />
            </Suspense>
          ) : (
            <div>
              <p>Beneficiary Data Not found</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default IssuanceDetailsDialog;
