import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import React, { useEffect, useState } from "react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import {
  useGetCandidateVerificationStatusQuery,
  useSendOtpMutation,
  useSendOtpToAdminMutation,
  useVerifyOtpMutation,
} from "../store/verificationApiSlice";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNavigate, useParams } from "react-router-dom";
import { useGetCandidateByIdQuery } from "@/features/candidates/store/candidatesApiSlice";
import { toast } from "sonner";
import { Loader2Icon, MailIcon, PhoneCallIcon } from "lucide-react";
import Hint from "@/components/ui/hint";
import LaptopDistSupportFooter from "@/features/shared/LaptopDistSupportFooter";

const OtpVerification = () => {
  const [otp, setOtp] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);

  const navigate = useNavigate();

  const { candidateId } = useParams<{ candidateId: string }>();

  const [
    sendOtp,
    { isLoading: isSending, isSuccess: isOtpSent, isError: isOtpSendError },
  ] = useSendOtpMutation();
  const [cooldown, setCooldown] = useState<number>(0);
  const [isRequestedFromAdmin, setIsRequestedFromAdmin] =
    useState<boolean>(false);

  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();
  const { data: candidateDetails, isLoading: isFetchingCandidateDetails } =
    useGetCandidateByIdQuery(candidateId!, {
      skip: !candidateId,
      refetchOnMountOrArgChange: true,
    });
  const { data: verificationStatus, isLoading: isFetchingVerificationStatus } =
    useGetCandidateVerificationStatusQuery(candidateId!, {
      skip: !candidateId,
      refetchOnMountOrArgChange: true,
    });
  const [
    sendOtpToAdmin,
    { isLoading: isSendingToAdmin, isError: isAdminOtpError },
  ] = useSendOtpToAdminMutation();

  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = Math.max(0, Math.floor((expiry - now) / 1000));

      setRemainingTime(diff);

      // auto stop at zero
      if (diff <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  useEffect(() => {
    if (
      candidateDetails &&
      !isFetchingCandidateDetails &&
      candidateDetails?.data?.candidate?.issued_status === "issued"
    ) {
      console.log("YES IT IS ISSUED.");
      navigate(
        `/store/beneficiary/${candidateDetails?.data?.candidate?.id}/issuance/success`,
      );
    }
  }, [candidateDetails, isFetchingCandidateDetails]);

  useEffect(() => {
    const v = verificationStatus?.data;
    if (!isFetchingVerificationStatus && verificationStatus) {
      if (!v?.is_coupon_verified) {
        toast.error("Beneficiary details are not yet verified.");
        navigate("/store/beneficiary");
        return;
      }
      if (
        (!v?.is_facial_verified || !v?.is_aadhar_verified) &&
        !v?.overriding_user
      ) {
        toast.error("Beneficiary details are not yet verified.");
        navigate("/store/beneficiary");
        return;
      }

      if (!hasSentOtp.current) {
        hasSentOtp.current = true;

        toast.promise(handleSendOtp(), {
          loading: "Sending OTP...",
          success: "OTP sent successfully!",
          error: (err) => err.message || "Failed to send OTP",
        });
      }
    }
  }, [verificationStatus, isFetchingVerificationStatus]);

  const handleSendOtp = async (to_admin = false) => {
    if (cooldown > 0) return;

    if (!candidateId) {
      throw new Error("Invalid Beneficiary ID");
    }

    try {
      const response = !to_admin
        ? await sendOtp(candidateId).unwrap()
        : await sendOtpToAdmin(candidateId).unwrap();
      if (to_admin) {
        setIsRequestedFromAdmin(true);
      }

      setError(null);

      // ✅ Store expiry time from server
      if (response?.data?.expires_at) {
        const expiry = new Date(response.data.expires_at + "Z");
        setExpiresAt(expiry);
      }
    } catch (err) {
      const errMsg: string =
        err?.data?.detail?.msg ??
        err?.data?.detail ??
        "Error Sending OTP. Try again";

      setError(errMsg);
      throw err;
    }

    setCooldown(60);

    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const hasSentOtp = React.useRef(false);

  // useEffect(() => {
  //   if (hasSentOtp.current) return;
  //   hasSentOtp.current = true;

  //   toast.promise(handleSendOtp(), {
  //     loading: "Sending OTP...",
  //     success: "OTP sent successfully!",
  //     error: (err) => err.message || "Failed to send OTP",
  //   });
  // }, []);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (otp.length !== 6) {
      setError("Enter a 6-digit OTP");
      return;
    }

    try {
      const res = await verifyOtp({ candidateId, otp }).unwrap();
      setError("");
      if (res.data.is_requested_for_upgrade) {
        navigate(`/store/beneficiary/upgrade/issue/${candidateId}`);
        toast.info("OTP Verified. Processing upgrade");
        return;
      }
      navigate(`/store/beneficiary/${candidateId}/issuance`);
      toast.info("OTP Verified. Processing issuance");
      return;
    } catch (err: any) {
      const msg = err?.data?.detail?.msg ?? err?.data?.detail ?? "Invalid OTP";
      setError(msg);
    }
  };

  return (
    <div className="w-full h-[calc(100vh-71px)] flex flex-col">
      <div className="container max-w-md mx-auto py-8 flex-1">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-center text-xl">
              OTP Verification
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Enter the OTP sent to beneficiary's mobile number:{" "}
              {candidateDetails?.data?.candidate?.mobile_number}
            </p>

            {/* ERROR MESSAGE */}
            {error && (
              <div className="bg-red-50 text-red-600 border border-red-300 px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}
            {isRequestedFromAdmin && (
              <div className="border">
                <p>OTP has been sent to admin. Contact for details</p>
                <p className="flex items-center gap-1">
                  <PhoneCallIcon className="w-4 h-4" />
                  Phone: 9573525695
                </p>
                <p className="flex items-center gap-1">
                  <MailIcon className="w-4 h-4" />
                  Email: cgharshavardhan@titan.co.in
                </p>
              </div>
            )}

            {/* OTP FIELD */}
            <form
              onSubmit={handleVerifyOtp}
              className="flex flex-col gap-4 items-center"
            >
              <div className="relative group w-full flex justify-center">
                <div
                  className={`${
                    !isOtpSent ? "cursor-not-allowed opacity-60" : ""
                  }`}
                >
                  <InputOTP
                    maxLength={6}
                    pattern={REGEXP_ONLY_DIGITS}
                    value={otp}
                    onChange={setOtp}
                    disabled={!isOtpSent}
                  >
                    <InputOTPGroup>
                      {Array.from({ length: 6 }).map((_, i) =>
                        i === 3 ? (
                          <React.Fragment key={i}>
                            <InputOTPSeparator />
                            <InputOTPSlot index={i} />
                          </React.Fragment>
                        ) : (
                          <InputOTPSlot index={i} key={i} />
                        ),
                      )}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {!isOtpSent && (
                  <div className="absolute -top-7 text-xs bg-black text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
                    OTP input enables after sending OTP
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-2 w-full justify-center">
                {(isOtpSent || isOtpSendError) && (
                  <div className="flex gap-2 justify-center">
                    <Button
                      type="button"
                      onClick={() => {
                        toast.promise(handleSendOtp(), {
                          loading: "Sending OTP...",
                          success: "OTP sent successfully!",
                          error: (err) => err.message || "Failed to send OTP",
                        });
                      }}
                      disabled={isSending || cooldown > 0}
                    >
                      {isSending ? (
                        <>
                          <Loader2Icon className="animate-spin w-3 h-3" />
                          <span>Sending...</span>
                        </>
                      ) : cooldown > 0 ? (
                        `Resend in ${cooldown}s`
                      ) : isOtpSent || isOtpSendError ? (
                        "Resend OTP"
                      ) : (
                        "Send OTP"
                      )}
                    </Button>
                    <Hint label="Request OTP from Admin">
                      <Button
                        type="button"
                        onClick={() => {
                          toast.promise(handleSendOtp(true), {
                            loading: "Sending OTP...",
                            success: "OTP sent successfully!",
                            error: (err) => err.message || "Failed to send OTP",
                          });
                        }}
                        disabled={isSendingToAdmin || cooldown > 0}
                        variant={"secondary"}
                      >
                        {isSendingToAdmin ? (
                          <>
                            <Loader2Icon className="animate-spin w-3 h-3" />
                            <span>Sending...</span>
                          </>
                        ) : cooldown > 0 ? (
                          `Request Admin in ${cooldown}s`
                        ) : isOtpSent || isOtpSendError ? (
                          "Request Admin"
                        ) : (
                          "Request Admin"
                        )}
                      </Button>
                    </Hint>
                  </div>
                )}

                <Button type="submit" disabled={!isOtpSent || isVerifying}>
                  {isVerifying ? (
                    <>
                      <Loader2Icon className="animate-spin w-3 h-3" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    "Verify OTP"
                  )}
                </Button>
              </div>
            </form>
            <CardFooter>
              {remainingTime > 0 && (
                <p className="text-center text-sm text-orange-600 font-medium">
                  OTP expires in {formatTime(remainingTime)}
                </p>
              )}

              {remainingTime === 0 && expiresAt && (
                <p className="text-center text-sm text-red-600 font-medium">
                  OTP expired. Please resend OTP.
                </p>
              )}
            </CardFooter>
          </CardContent>
        </Card>
      </div>
      <LaptopDistSupportFooter trouble="in OTP Verification" />
    </div>
  );
};

export default OtpVerification;
