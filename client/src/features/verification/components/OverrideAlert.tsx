import React, { useState } from "react";
import type { OverrideRequest, VerificationResult } from "../types";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertDescription } from "@/components/ui/alert";
import { CheckCircleIcon, XCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useOverrideVerificationMutation } from "../store/verificationApiSlice";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import Hint from "@/components/ui/hint";

interface OverrideAlertProps {
  data: VerificationResult;
  defOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const OverrideAlert: React.FC<OverrideAlertProps> = ({
  data,
  defOpen = false,
  onOpenChange,
}) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(defOpen);
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [aadharReason, setAadharReason] = useState("");
  const [facialReason, setFacialReason] = useState("");
  const [aadharOther, setAadharOther] = useState("");
  const [facialOther, setFacialOther] = useState("");

  const [overrideVerification, { isLoading }] =
    useOverrideVerificationMutation();

  const handleProceed = () => {
    if (data.verification_status.is_all_verified) {
      navigate(`/store/beneficiary/${data.candidate.candidate_id}/verify/otp`);
    }
  };

  const OVERRIDE_REASONS = {
    aadhar: [
      "Aadhaar card damaged/unreadable",
      "Beneficiary forgot bringing aadhaar",
      "Manual document verified",
    ],
    facial: [
      "Camera quality too poor",
      "Lighting conditions not suitable",
      "Face partially covered",
      "Temporary facial change (injury, swelling)",
    ],
  };
  const aadharFailed = !data.verification_status.is_aadhar_verified;
  const facialFailed = !data.verification_status.is_facial_verified;

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalReason = "";

    if (aadharFailed) {
      const v = aadharReason === "other" ? aadharOther.trim() : aadharReason;

      if (!v) {
        toast.warning("Please select Aadhaar reason");
        return;
      }

      finalReason += `Aadhaar: ${v}`;
    }

    if (facialFailed) {
      const v = facialReason === "other" ? facialOther.trim() : facialReason;

      if (!v) {
        toast.warning("Please select Facial reason");
        return;
      }

      if (finalReason) finalReason += " | ";
      finalReason += `Facial: ${v}`;
    }

    try {
      const res = await overrideVerification({
        candidateId: data.candidate.candidate_id,
        payload: { overriding_reason: finalReason },
      }).unwrap();

      toast.success(res.msg);

      if (res.data.can_proceed_to_otp) {
        navigate(
          `/store/beneficiary/${data.candidate.candidate_id}/verify/otp`
        );
      }
    } catch (err: any) {
      const errMsg =
        err?.data?.detail?.msg ??
        err?.data?.detail ??
        "Override failed. Try again.";
      toast.error(errMsg);
    }
  };

  const StatusItem = ({
    label,
    status,
  }: {
    label: string;
    status: boolean;
  }) => (
    <li className="flex justify-between items-center text-sm border-b py-1">
      <span>{label}</span>
      <Hint label={status ? "Success" : "Failed"}>
        <span
          className={clsx(
            "flex items-center gap-2 font-medium",
            status ? "text-green-600" : "text-red-600"
          )}
        >
          {status ? (
            <CheckCircleIcon className="w-4 h-4" />
          ) : (
            <XCircleIcon className="w-4 h-4" />
          )}
        </span>
      </Hint>
    </li>
  );

  return (
    <AlertDialog
      open={open}
      onOpenChange={() => {
        setOpen((prev) => !prev);
        onOpenChange(open);
      }}
    >
      <AlertDialogContent className="max-w-3xl max-h-[600px] overflow-auto">
        <AlertDialogHeader>
          <AlertDialogTitle
            className={`text-center ${
              data.requires_consent ? "text-red-600" : ""
            }`}
          >
            {data.requires_consent
              ? "Verification Failed"
              : "Verification Status"}
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="grid grid-cols-2 gap-6 mt-4">
          {/* LEFT BLOCK */}
          <div className="rounded-md border p-4">
            <h3 className="font-semibold text-sm mb-3 text-center">
              Verification Status
            </h3>
            <ul>
              <StatusItem
                label="Voucher Code"
                status={data.verification_status.is_coupon_verified}
              />
              <StatusItem
                label="Aadhar Number"
                status={data.verification_status.is_aadhar_verified}
              />
              <StatusItem
                label="Facial Recognition"
                status={data.verification_status.is_facial_verified}
              />
            </ul>
          </div>

          {/* RIGHT BLOCK */}
          <div className="rounded-md border p-4">
            <h3 className="font-semibold text-sm mb-3 text-center">
              Beneficiary Details
            </h3>
            <div className="text-sm space-y-1">
              <p>
                <strong>ID:</strong> {data.candidate.candidate_id}
              </p>
              <p>
                <strong>Name:</strong> {data.candidate.full_name}
              </p>
              <p>
                <strong>Mobile:</strong> {data.candidate.mobile_number}
              </p>
            </div>

            <div className="flex justify-center mt-4">
              <img
                src={`${
                  import.meta.env.VITE_API_BASE_API_URL
                }/hard_verify/api/v1.0/${data.candidate.photo}`}
                className="w-32 h-32 border rounded-md object-cover"
              />
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <AlertDialogFooter className="flex justify-between items-center mt-6">
          {data.verification_status.is_all_verified ? (
            <>
              <p className="text-sm text-gray-600">
                All verifications passed. Proceed to OTP verification.
              </p>
              <Button onClick={handleProceed}>Proceed</Button>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Do you want to proceed without verification?
              </p>

              {!showOverrideForm ? (
                <Button onClick={() => setShowOverrideForm(true)}>Yes</Button>
              ) : null}

              <AlertDialogCancel>Cancel</AlertDialogCancel>
            </>
          )}
        </AlertDialogFooter>

        {/* OVERRIDE FORM */}
        {showOverrideForm && (
          <form
            onSubmit={handleOverrideSubmit}
            className="border-t pt-4 mt-4 space-y-6"
          >
            <AlertDescription className="text-center">
              Select reason(s) for override
            </AlertDescription>

            {aadharFailed && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">
                  Aadhaar Verification Failed
                </h4>

                {OVERRIDE_REASONS.aadhar.map((r, i) => (
                  <label
                    key={i}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="aadhar_reason"
                      value={r}
                      checked={aadharReason === r}
                      onChange={(e) => setAadharReason(e.target.value)}
                    />
                    <span>{r}</span>
                  </label>
                ))}

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="aadhar_reason"
                    value="other"
                    checked={aadharReason === "other"}
                    onChange={(e) => setAadharReason(e.target.value)}
                  />
                  <span>Other</span>
                </label>

                {aadharReason === "other" && (
                  <Textarea
                    value={aadharOther}
                    onChange={(e) => setAadharOther(e.target.value)}
                    placeholder="Enter Aadhaar reason..."
                  />
                )}
              </div>
            )}

            {facialFailed && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">
                  Facial Verification Failed
                </h4>

                {OVERRIDE_REASONS.facial.map((r, i) => (
                  <label
                    key={i}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="facial_reason"
                      value={r}
                      checked={facialReason === r}
                      onChange={(e) => setFacialReason(e.target.value)}
                    />
                    <span>{r}</span>
                  </label>
                ))}

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="facial_reason"
                    value="other"
                    checked={facialReason === "other"}
                    onChange={(e) => setFacialReason(e.target.value)}
                  />
                  <span>Other</span>
                </label>

                {facialReason === "other" && (
                  <Textarea
                    value={facialOther}
                    onChange={(e) => setFacialOther(e.target.value)}
                    placeholder="Enter Facial reason..."
                  />
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Submitting..." : "Submit"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowOverrideForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default OverrideAlert;
