import { Button } from "@/components/ui/button";
import { useLoginMutation } from "../store/authApiSlice";
import {
  Card,
  CardContent,
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
import { PasswordInput } from "../components/PasswordInput";
import LoginSupportFooter from "@/features/shared/LoginSupportFooter";

// import {
//   InputOTP,
//   InputOTPGroup,
//   InputOTPSeparator,
//   InputOTPSlot,
// } from "@/components/ui/input-otp";

// import { REGEXP_ONLY_DIGITS } from "input-otp";

declare global {
  interface Window {
    turnstile: any;
  }
}

const LoginPage: React.FC = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const widgetRenderedRef = React.useRef(false);
  const [credentials, setCredentials] = useState<LoginPayload>({
    email_or_mobile_number: "",
    password: "",
    mfa_code: "",
    captcha_token: "",
  });
  const [captchaStatus, setCaptchaStatus] = useState<
    "idle" | "loading" | "solved" | "error"
  >("idle");

  const navigate = useNavigate();
  const location = useLocation();

  const [login, { isLoading: isLoggingIn }] = useLoginMutation();

  const fromPath = location.state?.from?.pathname || "/dashboard";
  const fromSearch = location.state?.from?.search || "";
  const from = `${fromPath}${fromSearch}`;

  useEffect(() => {
    let widgetId: string | null = null;

    if (window.turnstile) {
      setCaptchaStatus("loading");
      widgetId = window.turnstile.render("#turnstile-widget", {
        sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY,
        callback: (token: string) => {
          setCredentials((prev) => ({ ...prev, captcha_token: token }));
          setCaptchaStatus("solved");
        },
        "error-callback": () => {
          setCaptchaStatus("error");
        },
      });
    }

    return () => {
      if (widgetId) {
        window.turnstile.remove(widgetId);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      // dispatch(
      //   loginSuccess({
      //     id: "asd",
      //     mobiemail_or_mobile_number: "harsha",
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
          state: { email: credentials.email_or_mobile_number },
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
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  return (
    <div className="flex flex-col items-center h-screen gap-0 overflow-auto">
      {/* Heading */}
      <h1 className="text-3xl font-bold text-center mt-15">
        Laptop Distribution - Login
      </h1>

      {/* Card */}
      <Card className="w-full max-w-md min-w-sm mt-5">
        <CardHeader>
          <CardTitle className="text-center text-lg">
            Enter your credentials below.
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form id="login-form" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              {/* Email */}
              <div className="grid grid-cols-[100px_1fr]">
                <Label
                  htmlFor="email_or_mobile_number"
                  className="w-64 text-left"
                >
                  Mobile Number
                </Label>
                <Input
                  id="email_or_mobile_number"
                  type="text"
                  value={credentials.email_or_mobile_number}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Password */}
              <div className="grid grid-cols-[100px_1fr]">
                <Label htmlFor="password" className="text-right">
                  Password
                </Label>
                <PasswordInput
                  id="password"
                  value={credentials.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div id="turnstile-widget" className="cf-turnstile"></div>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <p className="text-accent-foreground">
            Contact admin for password related issues.
          </p>
          {captchaStatus === "error" && (
            <p>Captcha Failed to fetch refresh the page and try again.</p>
          )}
          <div className="flex items-center justify-center gap-2">
            <div>
              <Hint label="Reset the credentials" side="left">
                <Button
                  type="button"
                  variant={"destructive"}
                  onClick={() =>
                    setCredentials({
                      email_or_mobile_number: "",
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
              <Hint
                label={
                  isLoggingIn
                    ? "Logging in ..."
                    : captchaStatus === "loading"
                    ? "Captcha Loading. Please wait."
                    : captchaStatus === "error"
                    ? "Captcha Error. refresh page and try again."
                    : "Login to your account"
                }
                side="right"
              >
                <div>
                  <Button
                    type="submit"
                    form="login-form"
                    className="w-full"
                    disabled={
                      isLoggingIn ||
                      captchaStatus === "loading" ||
                      captchaStatus === "error" ||
                      !credentials.captcha_token
                    }
                  >
                    {captchaStatus === "loading"
                      ? "Loading captcha..."
                      : isLoggingIn
                      ? "Logging in..."
                      : "Login"}
                  </Button>
                </div>
              </Hint>
            </div>
          </div>
        </CardFooter>
      </Card>

      <LoginSupportFooter />
    </div>
  );
};

export default LoginPage;
