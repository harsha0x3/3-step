import { Button } from "@/components/ui/button";
import { useLoginMutation } from "../store/authApiSlice";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { LoginPayload } from "../types";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "../store/authSlice";
import { toast } from "sonner";
import Hint from "@/components/ui/hint";

// import {
//   InputOTP,
//   InputOTPGroup,
//   InputOTPSeparator,
//   InputOTPSlot,
// } from "@/components/ui/input-otp";

// import { REGEXP_ONLY_DIGITS } from "input-otp";

const LoginPage: React.FC = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [credentials, setCredentials] = useState<LoginPayload>({
    email_or_username: "",
    password: "",
    mfa_code: "",
  });
  const navigate = useNavigate();
  const location = useLocation();
  const fromLocation = location.state?.from;

  const [login, { isLoading: isLoggingIn }] = useLoginMutation();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      // dispatch(
      //   loginSuccess({
      //     id: "asd",
      //     username: "harsha",
      //     email: credentials.email,
      //     firstName: "First",
      //     lastName: "last",
      //     role: "admin",
      //     isAuthenticated: true,
      //     isLoading: false,
      //     error: null,
      //   })
      // );
      const res = await login(credentials).unwrap();
      if (res.must_change_password) {
        navigate("/password-reset/request", {
          state: { email: credentials.email_or_username },
        });
        toast.info("You must change your password before continuing");
        return;
      }
      navigate("/");
    } catch (error) {
      console.error("ERROR looging in login page", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { id, value } = e.target;
    setCredentials((prev) => ({ ...prev, [id]: value }));
  };

  useEffect(() => {
    if (isAuthenticated) {
      // console.log("IS AUTH", currentAuthState.isAuthenticated);
      // console.log("FROM LOC", fromLocation);
      navigate(fromLocation, { replace: true });
    }
  }, [isAuthenticated]);

  return (
    <div className="flex flex-col items-center h-screen gap-10">
      {/* Heading */}
      <h1 className="text-3xl font-bold text-center mt-28">
        Laptop Distribution - Login
      </h1>

      {/* Card */}
      <Card className="w-full max-w-md min-w-sm mt-10">
        <CardHeader>
          <CardTitle className="text-center text-lg">
            Enter your credentials below.
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form id="login-form" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              {/* Email */}
              <div className="flex items-center gap-4">
                <Label htmlFor="email_or_username" className="w-32 text-right">
                  User-ID
                </Label>
                <Input
                  id="email_or_username"
                  type="email"
                  value={credentials.email_or_username}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Password */}
              <div className="flex items-center gap-4">
                <Label htmlFor="password" className="w-32 text-right">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={credentials.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <p className="text-accent-foreground">
            Contact admin for password related issues.
          </p>
          <div className="flex items-center justify-center gap-2">
            <div>
              <Hint label="Reset the credentials" side="left">
                <Button
                  type="button"
                  variant={"destructive"}
                  onClick={() =>
                    setCredentials({
                      email_or_username: "",
                      password: "",
                      mfa_code: "",
                    })
                  }
                >
                  Cancel
                </Button>
              </Hint>
            </div>
            <div>
              <Hint label="Login to your account" side="right">
                <Button
                  type="submit"
                  form="login-form"
                  className="w-full"
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? "Logging in..." : "Login"}
                </Button>
              </Hint>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
