import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
  VerificationResult,
  type ConsolidateVerificationRequest,
} from "../types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useConsolidateVerificationMutation } from "../store/verificationApiSlice";
import CandidateFaceCapture from "../components/CandidateFaceCapture";
import { Loader2, Loader2Icon, XIcon } from "lucide-react";
import Hint from "@/components/ui/hint";
import OverrideAlert from "../components/OverrideAlert";
import { useNavigate } from "react-router-dom";

const ConsolidateVerification: React.FC = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ConsolidateVerificationRequest>();
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [consolidateVerify, { isLoading: isVerifying }] =
    useConsolidateVerificationMutation();
  const navigate = useNavigate();
  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null);

  const handleCameraPhotoSubmit = async (formData: FormData) => {
    const file = formData.get("photo") as File;
    if (file) {
      setPhoto(file);
      if (file) setPhotoPreview(URL.createObjectURL(file));
      toast.success("Photo captured successfully!");
    }
  };

  const onSubmit = async (data: ConsolidateVerificationRequest) => {
    if (!photo) {
      toast.error("Please capture beneficiary's photo for facial recognition");
      return;
    }
    if (verificationResult) {
      setVerificationResult(null);
    }

    try {
      const formData = new FormData();
      formData.append("aadhar_number", data.aadhar_number);
      formData.append("coupon_code", data.coupon_code);
      formData.append("photo", photo);

      const res = await consolidateVerify(formData).unwrap();
      if (res.data.verification_status.is_all_verified) {
        navigate(
          `/store/beneficiary/${res.data.candidate.candidate_id}/verify/otp`
        );
      }
      setVerificationResult(res.data);
      toast.info(res.msg);
    } catch (err) {
      const errMsg =
        err?.data?.detail?.msg ??
        err?.data?.detail ??
        "Error adding Vendor SPOC";
      toast.error(errMsg);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      {!!verificationResult && verificationResult?.requires_consent && (
        <OverrideAlert
          data={verificationResult}
          defOpen={true}
          onOpenChange={(isOpen: boolean) => {
            if (!isOpen) {
              setVerificationResult(null);
            }
          }}
        />
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-xl">
            Beneficiary Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-6"
            id="consolidate-verification-form"
            onSubmit={handleSubmit(onSubmit)}
          >
            {errors.coupon_code && (
              <span className="text-sm text-red-500">
                {errors.coupon_code.message}
              </span>
            )}
            <div className="grid grid-cols-[130px_1fr] gap-2">
              <Label htmlFor="coupon_code">Voucher Code</Label>
              <Input
                id="coupon_code"
                {...register("coupon_code", {
                  required: "Voucher Code is required field",
                })}
                className="w-74"
              />
            </div>

            {errors.aadhar_number && (
              <span className="text-sm text-red-500">
                {errors.aadhar_number.message}
              </span>
            )}
            <div className="grid grid-cols-[130px_1fr] gap-2">
              <Label htmlFor="aadhar_number">Aadhar Number</Label>
              <Input
                id="aadhar_number"
                {...register("aadhar_number", {
                  required: "Aadhar Number is required field",
                })}
                className="w-74"
              />
            </div>

            <div className="grid grid-cols-[130px_1fr] gap-2">
              <Label htmlFor="candidate_photo">Facial Recognition</Label>
              <div className="w-74">
                <CandidateFaceCapture
                  onSubmit={handleCameraPhotoSubmit}
                  triggerTitle={photo && photoPreview ? "Retake" : "Capture"}
                />
              </div>
            </div>
            {photoPreview ? (
              <div className="relative w-40 h-40">
                <img
                  src={photoPreview}
                  alt="Captured beneficiary photo"
                  className="w-40 h-40 object-cover rounded-md border-2"
                />
                <Hint label="Remove photo" side="right">
                  <Button
                    variant={"ghost"}
                    type="button"
                    onClick={() => {
                      setPhoto(null);
                      setPhotoPreview(null);
                    }}
                    className="absolute -top-2 -right-2 rounded-full w-4 h-4 flex items-center justify-center transition border bg-accent"
                  >
                    <XIcon className="text-red-500 w-3 h-3" />
                  </Button>
                </Hint>
              </div>
            ) : (
              <div className="w-40 h-40"></div>
            )}
          </form>
        </CardContent>
        <CardFooter>
          <div className="flex items-center justify-center w-full gap-2">
            <Button
              form="consolidate-verification-form"
              type="submit"
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <Loader2Icon className="animate-spin w-3 h-3" />
                  <span>Submitting...</span>
                </>
              ) : (
                "Submit"
              )}
            </Button>
            <Button
              type="button"
              variant={"secondary"}
              onClick={() => {
                reset();
                setPhoto(null);
                setPhotoPreview(null);
                setVerificationResult(null);
              }}
            >
              Reset
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ConsolidateVerification;
