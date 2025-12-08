import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRequestPasswordResetMutation } from "@/features/auth/store/usersApiSlice";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";

const PasswordResetRequest: React.FC = () => {
  const [requestReset, { isLoading }] = useRequestPasswordResetMutation();
  const navigate = useNavigate();
  const location = useLocation();
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: location.state?.email || "",
    },
  });

  const email = watch("email");

  const onSubmit = async (data: { email: string }) => {
    try {
      await requestReset({ email: data.email }).unwrap();
      setEmailSent(true);
      toast.success("Reset code sent to your mobile number");

      // Navigate to verify page after 2 seconds
      setTimeout(() => {
        navigate("/password-reset/verify", { state: { email: data.email } });
      }, 2000);
    } catch (error: any) {
      toast.error(error?.data?.detail || "Failed to send reset code");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Your Password</CardTitle>
        </CardHeader>
        <CardContent>
          {!emailSent ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Mobile Number</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="your mobile"
                  {...register("email", { required: "Email is required" })}
                />
                {errors.email?.message && (
                  <span className="text-sm text-red-500">
                    {String(errors.email.message)}
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-600">
                We'll send a 6-digit code to your email address.
              </p>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Reset Code"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => navigate("/login")}
              >
                Back to Login
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="text-green-600 text-lg font-semibold">
                ✓ Code Sent!
              </div>
              <p className="text-gray-600">
                We've sent a reset code to {email}
              </p>
              <p className="text-sm text-gray-500">
                Redirecting you to verification page...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PasswordResetRequest;
