import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// import { useGetCandidateByIdQuery } from "@/features/candidates/store/candidatesApiSlice";
import { AlertDialogAction } from "@radix-ui/react-alert-dialog";
import React, { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  useProceedWithNoUpgradeMutation,
  useRequestNewUpgradeMutation,
} from "../store/verificationApiSlice";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import type { RequestNewUpgrade } from "../types";

const UpgradeChoice: React.FC = () => {
  const navigate = useNavigate();
  // const location = useLocation();
  // const candidateData = location.state?.candidate ?? null;
  const { candidateId } = useParams();
  const [upgradeProductInfo, setUpgradeProductInfo] = useState("");
  const [costOfUpgrade, setCostOfUpgrade] = useState<number>(0);
  const [availableDate, setAvailableDate] = useState<string>("");

  // const { data: candidateInfo } = useGetCandidateByIdQuery(candidateId, {
  //   skip: !candidateId || !!candidateData,
  // });
  const [proceedWithNoUpgrade, { isLoading: isProceedingWithNoUpgrade }] =
    useProceedWithNoUpgradeMutation();
  const [requestNewUpgrade, { isLoading: isRequestingUpgrade }] =
    useRequestNewUpgradeMutation();
  // const candidate = useMemo(() => {
  //   if (candidateData) {
  //     return candidateData;
  //   } else if (candidateInfo) {
  //     return candidateInfo.data;
  //   } else {
  //     return null;
  //   }
  // }, [candidateData, candidateInfo]);

  const [openUpgradeAlert, setOpenUpgradeAlert] = useState<boolean>(false);
  const [openLaterDialog, setOpenLaterDialog] = useState<boolean>(false);
  const [opensuccessDialog, setOpenSuccessDialog] = useState<boolean>(false);

  const requestUpgradeLater = async () => {
    if (!upgradeProductInfo.trim()) {
      toast.error("Upgrade product info is required");
      return;
    }

    const payload: RequestNewUpgrade = {
      upgrade_product_info: upgradeProductInfo,
      cost_of_upgrade: costOfUpgrade,
      scheduled_at: availableDate,
    };

    try {
      const res = await requestNewUpgrade({
        candidateId,
        payload,
      }).unwrap();

      toast.success(res.msg ?? "Upgrade requested successfully");
      setOpenLaterDialog(false);
      setOpenSuccessDialog(true);
      // navigate(`/store/beneficiary`);
    } catch (err) {
      let errMsg = err?.data?.detail;
      if (typeof errMsg !== "string") {
        errMsg = "Error requesting upgrade";
      }
      toast.error(errMsg);
    }
  };

  return (
    <div className="w-full h-[calc(100vh-71px)] flex flex-col sm:flex-row items-center gap-10 overflow-auto justify-center">
      <Card className="w-full max-w-1/3">
        <CardHeader>
          <CardTitle>Issue</CardTitle>
        </CardHeader>
        <CardContent></CardContent>
        <CardFooter>
          <Button
            disabled={isProceedingWithNoUpgrade}
            onClick={async () => {
              try {
                const res = await proceedWithNoUpgrade({
                  candidateId: candidateId,
                }).unwrap();
                toast.success(res.msg ?? "Proceeding with no upgrade");
                navigate(`/store/beneficiary/${candidateId}/verify/otp`);
                return;
              } catch (err) {
                toast.error("Error Proceeding with no upgrade. Try again");
              }
            }}
          >
            {isProceedingWithNoUpgrade ? (
              <span>
                <Loader2 className="animate-spin" /> Loading..
              </span>
            ) : (
              "Proceed"
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card className="w-full max-w-1/3">
        <CardHeader>
          <CardTitle>Upgrade</CardTitle>
        </CardHeader>
        <CardContent></CardContent>
        <CardFooter>
          <Button
            onClick={() => {
              setOpenUpgradeAlert(true);
            }}
          >
            Proceed
          </Button>
        </CardFooter>
      </Card>

      {/* Upgrade Alert */}
      <AlertDialog open={openUpgradeAlert} onOpenChange={setOpenUpgradeAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you going to issue now or later?
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-2">
              <AlertDialogCancel>Cancel</AlertDialogCancel>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <AlertDialogAction asChild>
                  <Button
                    variant="secondary"
                    disabled={isRequestingUpgrade}
                    onClick={async () => {
                      try {
                        console.log("YES UPGRADE");
                        const res = await requestNewUpgrade({
                          candidateId,
                          payload: null,
                        }).unwrap();
                        navigate(
                          `/store/beneficiary/${candidateId}/verify/otp`
                        );
                        return;
                      } catch (err) {
                        let errMsg = err.data?.detail;
                        if (typeof errMsg !== "string") {
                          errMsg = "Error requesting upgrade";
                        }
                        toast.error(errMsg);
                      }
                    }}
                  >
                    {isRequestingUpgrade ? (
                      <span>
                        <Loader2 className="animate-spin" /> Loading..
                      </span>
                    ) : (
                      "Now"
                    )}
                  </Button>
                </AlertDialogAction>
                <AlertDialogAction asChild>
                  <Button
                    disabled={isRequestingUpgrade}
                    onClick={() => setOpenLaterDialog(true)}
                  >
                    {isRequestingUpgrade ? (
                      <span>
                        <Loader2 className="animate-spin" /> Loading..
                      </span>
                    ) : (
                      "Later"
                    )}
                  </Button>
                </AlertDialogAction>
              </div>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Later Upgrade Info */}
      <AlertDialog open={openLaterDialog} onOpenChange={setOpenLaterDialog}>
        <AlertDialogContent>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault(); // stop page reload
              requestUpgradeLater();
            }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle className="text-center pb-3">
                Schedule Laptop Upgrade
              </AlertDialogTitle>
            </AlertDialogHeader>

            {/* Upgrade Product Info */}
            <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr]">
              <Label>
                Upgrade Details <span className="text-red-600">*</span>
              </Label>
              <Textarea
                placeholder=""
                value={upgradeProductInfo}
                onChange={(e) => setUpgradeProductInfo(e.target.value)}
                required
              />
            </div>

            {/* Cost */}
            <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr]">
              <Label>
                Additional Cost <span className="text-red-600">*</span>
              </Label>
              <Input
                type="number"
                value={costOfUpgrade}
                onChange={(e) => setCostOfUpgrade(Number(e.target.value))}
                required
              />
            </div>

            {/* Available Date */}
            <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr]">
              <Label>
                Available Date <span className="text-red-600">*</span>
              </Label>
              <Input
                type="date"
                value={availableDate}
                onChange={(e) => setAvailableDate(e.target.value)}
                required
              />
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>

              <Button type="submit" disabled={isRequestingUpgrade}>
                {isRequestingUpgrade ? "Submitting..." : "Submit"}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      {/* success dialog */}
      <AlertDialog open={opensuccessDialog} onOpenChange={setOpenSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogTitle>
            Laptop upgrade is scheduled on {availableDate}
          </AlertDialogTitle>
          <AlertDialogFooter>
            <Button
              onClick={() => {
                navigate("/store/beneficiary");
              }}
            >
              Ok
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Normal Issuance */}
      {/* <AlertDialog open={openIssueAlert} onOpenChange={setOpenIssueAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure to proceed with no upgrade?
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction asChild>
              <Button
                disabled={isProceedingWithNoUpgrade}
                onClick={async () => {
                  try {
                    const res = await proceedWithNoUpgrade({
                      candidateId: candidateId,
                    }).unwrap();
                    toast.success(res.msg ?? "Proceeding with no upgrade");
                    navigate(`/store/beneficiary/${candidateId}/verify/otp`);
                    return;
                  } catch (err) {
                    toast.error("Error Proceeding with no upgrade. Try again");
                  }
                }}
              >
                {isProceedingWithNoUpgrade ? (
                  <span>
                    <Loader2 className="animate-spin" /> Loading..
                  </span>
                ) : (
                  "Yes"
                )}
              </Button>
            </AlertDialogAction>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog> */}
    </div>
  );
};

export default UpgradeChoice;
