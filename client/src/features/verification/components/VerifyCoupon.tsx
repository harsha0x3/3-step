// src/features/verification/components/VerifyCoupon.tsx
import React from "react";
import { useVerifyCouponMutation } from "../store/verificationApiSlice";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
interface VerifyCouponProps {
  candidateId: string;
}
const VerifyCoupon: React.FC<VerifyCouponProps> = ({ candidateId }) => {
  const [verifyCoupon, { isLoading: isVerifyingCoupon }] =
    useVerifyCouponMutation();
  const [couponCode, setCouponCode] = React.useState<string>("");

  const handleVerify = async () => {
    try {
      await verifyCoupon({ candidateId, couponCode }).unwrap();
    } catch (err) {
      const errMsg: string =
        err?.data?.detail?.msg ?? err?.data?.detail ?? "Error verifying face";

      const errDesc = err?.data?.detail?.msg
        ? err?.data?.detail?.err_stack
        : "";
      toast.error(errMsg, { description: errDesc });
    }
  };
  return (
    <div>
      <div className="flex flex-col gap-2 items-start p-4">
        <Label>Coupon Code</Label>
        <Input
          type="text"
          value={couponCode}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setCouponCode(e.target.value);
          }}
        />
        <div className="flex items-end">
          <Button
            onClick={handleVerify}
            disabled={isVerifyingCoupon || couponCode.trim() === ""}
          >
            {isVerifyingCoupon ? "Verifying..." : "Verify"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VerifyCoupon;
