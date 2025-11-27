// src/features/verification/pages/LaptopIssuancePage.tsx

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LaptopIssuanceForm from "../components/LaptopIssuanceForm";
import { useNavigate, useParams } from "react-router-dom";
import SuccessDialog from "../components/SuccessDialog";

const LaptopIssuancePage: React.FC = () => {
  const { candidateId } = useParams<{ candidateId: string }>();
  const [openSuccess, setOpenSuccess] = useState<boolean>(false);

  const navigate = useNavigate();

  return (
    <div className="flex justify-center py-10 px-4">
      <Card className="w-full max-w-3xl shadow-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Details of Laptop
          </CardTitle>
        </CardHeader>

        <CardContent>
          {candidateId ? (
            <LaptopIssuanceForm
              candidateId={candidateId}
              onSuccess={() => {
                setOpenSuccess(true);
              }}
            />
          ) : (
            <p className="text-center text-red-500">
              Invalid candidate ID, please Back to Dashboard.
            </p>
          )}
          <SuccessDialog open={openSuccess} setOpen={setOpenSuccess} />
        </CardContent>
      </Card>
    </div>
  );
};

export default LaptopIssuancePage;
