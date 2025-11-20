// src/features/verification/components/OtpVerification.tsx

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import React, { useState } from "react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import {
  useSendOtpMutation,
  useVerifyOtpMutation,
} from "../store/verificationApiSlice";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface OtpVerificationProps {
  candidateId: string;
  onSuccess?: () => void;
}

const OtpVerification: React.FC<OtpVerificationProps> = ({
  candidateId,
  onSuccess,
}) => {
  const [otp, setOtp] = useState<string>("");
  const [sendOtp, { isLoading: isSending, error: otpSendError }] =
    useSendOtpMutation();
  const [verifyOtp, { isLoading: isVerifying, error: verifyError }] =
    useVerifyOtpMutation();

  const handleSendOtp = async () => {
    try {
      await sendOtp(candidateId).unwrap();
      toast.success("OTP sent successfully");
    } catch (err) {
      const errMsg: string =
        err?.data?.detail?.msg ?? err?.data?.detail ?? "Error Verifying OTP";

      const errDesc = err?.data?.detail?.msg
        ? err?.data?.detail?.err_stack
        : "";
      toast.error(errMsg, { description: errDesc });
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const strOtp = `${otp}`;
      await verifyOtp({ candidateId, otp: strOtp }).unwrap();
      toast.success("OTP verified. Candidate verified successfully!");
      onSuccess?.();
    } catch (err: any) {
      console.error("Error in otp verify", err);
      const errMsg: string =
        err?.data?.detail?.msg ?? err?.data?.detail ?? "Error verifying Otp";
      toast.error(`${errMsg}`);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-md mt-4">
      <p>Request for OTP by clicking on send OTP button.</p>
      <Button onClick={handleSendOtp} disabled={isSending}>
        {isSending ? "Sending OTP ..." : "Send OTP"}
      </Button>
      <form onSubmit={handleVerifyOtp} className="flex flex-col gap-2">
        <InputOTP
          id="mfa_code"
          maxLength={6}
          pattern={REGEXP_ONLY_DIGITS}
          value={otp}
          onChange={(val) => setOtp(val)}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSeparator />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>

        <Button type="submit" disabled={isVerifying}>
          {isVerifying ? "Verifying OTP..." : "Verify OTP"}
        </Button>
      </form>
    </div>
  );
};

export default OtpVerification;
