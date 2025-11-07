// src/features/verification/components/AddCouponDialog.tsx

import React, { useState } from "react";
import { useAddCouponToCandidateMutation } from "../store/verificationApiSlice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface CouponProps {
  candidateId: string;
}

const CouponDialog: React.FC<CouponProps> = ({ candidateId }) => {
  const [couponCode, setCouponCode] = useState<string>("");
  const [addCoupon, { isLoading: isAddingCoupon }] =
    useAddCouponToCandidateMutation();

  const handleSubmit = async () => {
    try {
      await addCoupon({ candidateId, couponCode }).unwrap();
      toast.success("Coupon added successfully");
      setCouponCode("");
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
    <Dialog>
      <DialogTrigger asChild>
        <Button size={"sm"}>Add Coupon</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Add coupon to candidate</DialogTitle>
        </DialogHeader>
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
              onClick={handleSubmit}
              disabled={isAddingCoupon || couponCode.trim() === ""}
            >
              {isAddingCoupon ? "Adding..." : "Add"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CouponDialog;
