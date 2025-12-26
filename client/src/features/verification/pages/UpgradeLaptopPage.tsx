// src\features\verification\pages\UpgradeLaptopPage.tsx

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams } from "react-router-dom";
import SuccessDialog from "../components/SuccessDialog";
import LaptopDistSupportFooter from "@/features/shared/LaptopDistSupportFooter";
import UpgradeLaptopForm from "../components/UpgradeLaptopForm";

const UpgradeLaptopPage: React.FC = () => {
  const { candidateId } = useParams<{ candidateId: string }>();
  const [openSuccess, setOpenSuccess] = useState<boolean>(false);

  return (
    <div>
      <div className="flex justify-center py-10 px-4">
        <Card className="w-full max-w-3xl shadow-md">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              Details of Upgraded Laptop
            </CardTitle>
          </CardHeader>

          <CardContent>
            {candidateId ? (
              <UpgradeLaptopForm
                candidateId={candidateId}
                onSuccess={() => {
                  setOpenSuccess(true);
                }}
              />
            ) : (
              <p className="text-center text-red-500">
                Invalid beneficiary ID, please Back to Stats.
              </p>
            )}
            <SuccessDialog open={openSuccess} setOpen={setOpenSuccess} />
          </CardContent>
        </Card>
      </div>
      <LaptopDistSupportFooter trouble="in Laptop Issuance" />
    </div>
  );
};

export default UpgradeLaptopPage;
