import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetCandidateByIdQuery } from "@/features/candidates/store/candidatesApiSlice";
import { CheckCircle2 } from "lucide-react";
import React from "react";
import { useParams } from "react-router-dom";
import IssuanceDetails from "../components/IssuanceDetails";
import { ScrollArea } from "@/components/ui/scroll-area";

const LaptopIssuanceSuccessPage: React.FC = () => {
  const { candidateId } = useParams<{ candidateId: string | undefined }>();
  const { data: candidateDetails, isLoading: isFetchingCandidateDetails } =
    useGetCandidateByIdQuery(candidateId!, {
      skip: !candidateId,
    });

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="flex flex-col max-h-[calc(100vh-8rem)]">
        <CardHeader className="shrink-0 py-0">
          <div className="flex justify-center">
            <CardTitle className="text-xl text-center font-bold text-green-700 flex items-center gap-2">
              <CheckCircle2 className="text-green-600 w-8 h-8" />
              Laptop Issuance Completed
            </CardTitle>
          </div>
        </CardHeader>
        <ScrollArea className="flex-1 overflow-y-auto min-h-0">
          <CardContent className="px-6 ">
            {!isFetchingCandidateDetails && candidateDetails && (
              <IssuanceDetails candidate={candidateDetails?.data?.candidate} />
            )}
          </CardContent>
        </ScrollArea>
      </Card>
    </div>
  );
};

export default LaptopIssuanceSuccessPage;
