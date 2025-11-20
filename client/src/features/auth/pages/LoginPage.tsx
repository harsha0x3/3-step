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
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { LoginPayload } from "../types";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "../store/authSlice";

// import {
//   InputOTP,
//   InputOTPGroup,
//   InputOTPSeparator,
//   InputOTPSlot,
// } from "@/components/ui/input-otp";

// import { REGEXP_ONLY_DIGITS } from "input-otp";

const LoginPage: React.FC = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [credentails, setCredentails] = useState<LoginPayload>({
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
      //     email: credentails.email,
      //     firstName: "First",
      //     lastName: "last",
      //     role: "admin",
      //     isAuthenticated: true,
      //     isLoading: false,
      //     error: null,
      //   })
      // );
      const res = await login(credentails).unwrap();
      console.log("LOGIN RESPONSE", res);
      navigate("/");
    } catch (error) {
      console.error("ERROR looging in login page", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { id, value } = e.target;
    setCredentails((prev) => ({ ...prev, [id]: value }));
  };

  useEffect(() => {
    if (isAuthenticated) {
      // console.log("IS AUTH", currentAuthState.isAuthenticated);
      // console.log("FROM LOC", fromLocation);
      navigate(fromLocation, { replace: true });
    }
  }, [isAuthenticated]);

  return (
    <div className="flex items-center justify-center h-screen">
      <Card className=" flex-1 w-ful max-w-md min-w-sm">
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="login-form" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email_or_username"
                  type="email"
                  placeholder="m@titan.co.in"
                  value={credentails.email_or_username}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={credentails.password}
                  onChange={handleChange}
                  required
                />
              </div>
              {/* <div className="grid gap-2">
                <Label htmlFor="mfa_code">MFA Code</Label>
                <InputOTP
                  id="mfa_code"
                  maxLength={6}
                  pattern={REGEXP_ONLY_DIGITS}
                  value={credentails.mfa_code}
                  onChange={(val) =>
                    setCredentails((prev) => ({ ...prev, mfa_code: val }))
                  }
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
              </div> */}
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button
            type="submit"
            form="login-form"
            className="w-full"
            disabled={isLoggingIn}
          >
            {isLoggingIn ? "Logging in..." : "Login"}
          </Button>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Button variant="link" className="p-0" asChild>
              <Link to={"/register"} className="underline underline-offset-4">
                Sign up
              </Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
