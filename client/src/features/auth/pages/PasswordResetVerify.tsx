import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useVerifyPasswordResetMutation } from "@/features/auth/store/usersApiSlice";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import { PasswordInput } from "../components/PasswordInput";
import LoginSupportFooter from "@/features/shared/LoginSupportFooter";

const PasswordResetVerify: React.FC = () => {
  const [verifyReset, { isLoading }] = useVerifyPasswordResetMutation();
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = React.useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: location.state?.email || "",
      new_password: "",
      confirm_password: "",
    },
  });

  const onSubmit = async (data: any) => {
    if (data.new_password !== data.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }

    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }

    try {
      await verifyReset({
        email: data.email,
        otp: otp,
        new_password: data.new_password,
      }).unwrap();

      toast.success("Password reset successfully!");
      navigate("/login");
    } catch (error: any) {
      toast.error(error?.data?.detail || "Failed to reset password");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 overflow-auto">
      <Card className="w-full max-w-md mt-5">
        <CardHeader>
          <CardTitle>Enter Reset Code</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Mobile Number</Label>
              <Input
                id="email"
                type="text"
                {...register("email")}
                readOnly
                className="bg-gray-100"
              />
            </div>

            <div className="space-y-2">
              <Label>Reset Code</Label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  pattern={REGEXP_ONLY_DIGITS}
                  value={otp}
                  onChange={setOtp}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_password">New Password</Label>
              <PasswordInput
                id="new_password"
                autoComplete="new-password"
                {...register("new_password", {
                  required: "Please enter new password",
                })}
              />
              {errors.new_password && (
                <span className="text-sm text-red-500">
                  {errors.new_password.message}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm Password</Label>
              <PasswordInput
                id="confirm_password"
                autoComplete="confirm-password"
                {...register("confirm_password", {
                  required: "Please confirm your password",
                })}
              />
              {errors.confirm_password && (
                <span className="text-sm text-red-500">
                  {errors.confirm_password.message}
                </span>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() =>
                navigate("/password-reset/request", {
                  state: { email: location.state?.email || "" },
                })
              }
            >
              Didn't receive code? Resend
            </Button>
          </form>
        </CardContent>
      </Card>
      <LoginSupportFooter />
    </div>
  );
};

export default PasswordResetVerify;
