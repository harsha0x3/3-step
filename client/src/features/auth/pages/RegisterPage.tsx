import React, { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useRegisterMutation } from "../store/authApiSlice";
import { type RegisterPayload } from "../types";
import { toast } from "sonner";

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState<RegisterPayload>({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "user",
  });
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [passwordsMatch, setPasswordsMatch] = useState<boolean>(true);
  const [register, { isLoading: isRegistering }] = useRegisterMutation();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formData.password !== confirmPassword) {
      setPasswordsMatch(false);
      return;
    }
    setPasswordsMatch(true);
    try {
      await register(formData).unwrap();
    } catch (err: any) {
      console.error("THERROR", err.error?.data?.msg);
      toast.error(err.data.msg);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setPasswordsMatch(formData.password === value);
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <Card className=" flex-1 w-ful max-w-md min-w-sm">
        <CardHeader>
          <CardTitle>Register your account here</CardTitle>
          <CardDescription>
            Enter your details below to create an account account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="login-form" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="flex gap-2">
                <div className="grid gap-2">
                  <Label htmlFor="email">First Name</Label>
                  <Input
                    id="first_name"
                    type="text"
                    placeholder="First Name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    disabled={isRegistering}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Last Name</Label>
                  <Input
                    id="last_name"
                    type="text"
                    placeholder="Last Name"
                    value={formData.last_name}
                    onChange={handleChange}
                    disabled={isRegistering}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Role</Label>
                <RadioGroup
                  className="w-full max-w-96 gap-3 rounded-md flex justify-between"
                  defaultValue={"store_personnel"}
                  value={formData.role} // bind to state
                  onValueChange={(value: RegisterPayload["role"]) =>
                    setFormData((prev) => ({ ...prev, role: value }))
                  }
                  disabled={isRegistering}
                >
                  <div
                    key="role-store_personnel"
                    className="flex-1 border-input has-data-[state=checked]:border-primary/50 has-data-[state=checked]:bg-accent relative flex flex-col border px-4 py-2 outline-none rounded-md has-data-[state=checked]:z-10"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem
                        id="role-store_personnel"
                        value={"store_personnel"}
                        disabled={isRegistering}
                      />
                      <Label htmlFor="role-store_personnel">
                        Store Personnel
                      </Label>
                    </div>
                  </div>
                  <div className="flex-1 border-input has-data-[state=checked]:border-primary/50 has-data-[state=checked]:bg-accent relative flex flex-col border px-4 py-2 outline-none rounded-md has-data-[state=checked]:z-10">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem
                        id="role-admin"
                        value={"admin"}
                        disabled={isRegistering}
                      />
                      <Label htmlFor="role-admin">Admin</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
              <div className="flex gap-2">
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    disabled={isRegistering}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@titan.co.in"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={isRegistering}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isRegistering}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  required
                  disabled={isRegistering}
                />
                {!passwordsMatch && confirmPassword && (
                  <Alert variant="destructive">
                    <AlertTitle>Passwords do not match</AlertTitle>
                    <AlertDescription>
                      Please make sure your password and confirm password match.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button
            type="submit"
            form="login-form"
            className="w-full"
            disabled={isRegistering}
          >
            {isRegistering ? "Registering..." : "Register"}
          </Button>
          <div className="mt-4 text-center text-sm">
            Already have an account? disabled={isRegistering}
            <Button
              variant="link"
              asChild
              className="p-0"
              disabled={isRegistering}
            >
              <Link to={"/login"} className="underline underline-offset-4">
                Sign in
              </Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RegisterPage;
