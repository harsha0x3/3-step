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
}

const OtpVerification: React.FC<OtpVerificationProps> = ({ candidateId }) => {
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
      console.error("Error in Otp send", err);
      const errMsg: string =
        otpSendError?.data?.detail?.msg ??
        otpSendError?.data?.detail ??
        "Error verifying OTP";
      toast.error(errMsg);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log(`TYPE OF OTP ${typeof otp} AND OTP - ${otp}`);
      const strOtp = `${otp}`;
      await verifyOtp({ candidateId, otp: strOtp }).unwrap();
      toast.success("OTP verified. Candidate verified successfully!");
    } catch (err: any) {
      console.error("Error in otp verify", err);
      const errMsg: string =
        err?.data?.detail?.msg ?? err?.data?.detail ?? "Error verifying Otp";
      toast.error(`${errMsg}`);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-md mt-4">
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
