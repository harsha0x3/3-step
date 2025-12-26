import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import React, { useState } from "react";
import type {
  IssuedStatusWithUpgrade,
  RequestForUploadPayload,
} from "../types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  useConfirmRequestForUpgradeMutation,
  useNewRequestForUpgradeMutation,
} from "../store/verificationApiSlice";
import type { CandidateItemWithStore } from "@/features/candidates/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import IssuanceDetails from "../components/IssuanceDetails";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { AlertDescription } from "@/components/ui/alert";

const UpgradeRequestPage: React.FC = () => {
  const [upgradeRequestData, setUpgradeRequestData] =
    useState<RequestForUploadPayload>({
      coupon_code: "",
      existing_laptop_serial: "",
    });
  const [candidate, setCandidate] = useState<CandidateItemWithStore | null>(
    null
  );
  const [issuanceDetails, setIssuanceDetails] =
    useState<IssuedStatusWithUpgrade | null>(null);
  const [openConfirm, setOpenConfirm] = useState<boolean>(false);
  const navigate = useNavigate();
  const [
    newRequestForUpgrade,
    { isError, error, isLoading: isRequestingUpgrade },
  ] = useNewRequestForUpgradeMutation();
  const [confirmRequestForUpgrade, { isLoading: isConfirmingRequest }] =
    useConfirmRequestForUpgradeMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setUpgradeRequestData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await newRequestForUpgrade(upgradeRequestData).unwrap();
      setCandidate(res.data?.candidate);
      setIssuanceDetails(res.data?.issuance_details);
      setOpenConfirm(true);
    } catch (error) {
      return;
    }
  };
  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 md:px-8 max-w-full md:max-w-2xl">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-center text-xl">Upgrade Laptop</CardTitle>
        </CardHeader>
        <form
          id="upgrade-request-form"
          className="space-y-10"
          onSubmit={handleSubmit}
        >
          <CardContent className="space-y-4">
            {isError && error && (
              <div className="border rounded-md px-2 py-4 bg-red-200 text-red-500">
                <p>{error?.data?.detail}</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr]">
              <Label className="font-medium">
                Gift Card Code<span className="text-red-600"> *</span>
              </Label>
              <Input
                id="coupon_code"
                value={upgradeRequestData.coupon_code}
                onChange={handleChange}
                required
                className="w-full sm:w-72"
                maxLength={16}
                minLength={8}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr]">
              <Label className="font-medium">
                Laptop Serial<span className="text-red-600"> *</span>
              </Label>
              <Input
                id="existing_laptop_serial"
                value={upgradeRequestData.existing_laptop_serial}
                onChange={handleChange}
                className="w-full sm:w-72"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              type="submit"
              form="upgrade-request-form"
              disabled={isRequestingUpgrade}
            >
              {!isRequestingUpgrade ? (
                "Submit"
              ) : (
                <span className="flex gap-2 items-center">
                  <Loader2Icon className="animate-spin w-4 h-4" />
                  Submitting..
                </span>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
      <AlertDialog open={openConfirm} onOpenChange={setOpenConfirm}>
        <AlertDialogContent className="max-h-[600px] overflow-y-auto sm:min-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold text-center">
              Confirmation
            </AlertDialogTitle>
            <AlertDescription>
              Verify beneficiary details and previous issuance.
            </AlertDescription>
          </AlertDialogHeader>
          {candidate && (
            <IssuanceDetails
              candidate={candidate}
              issuanceDetails={issuanceDetails}
              isToConfirm={true}
            />
          )}
          <AlertDialogFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <p className="text-amber-700">
              Are you sure to proceed for laptop upgrade?
            </p>
            <div className="space-x-4">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button
                  disabled={isConfirmingRequest}
                  onClick={async () => {
                    try {
                      await confirmRequestForUpgrade(upgradeRequestData);
                      navigate(
                        `/store/beneficiary/upgrade/beneficiary/${candidate.id}`,
                        {
                          state: {
                            existing_laptop_serial:
                              upgradeRequestData.existing_laptop_serial,
                          },
                        }
                      );
                    } catch (err) {
                      const errMsg =
                        err?.data?.detail?.msg ??
                        err?.data?.detail ??
                        "Something went wrong";
                      toast.error(errMsg);
                    }
                  }}
                >
                  {!isConfirmingRequest ? (
                    "Confirm"
                  ) : (
                    <span className="flex gap-2 items-center">
                      <Loader2Icon className="animate-spin w-4 h-4" />
                      Confirming..
                    </span>
                  )}
                </Button>
              </AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UpgradeRequestPage;
