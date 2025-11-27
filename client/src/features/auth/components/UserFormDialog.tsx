import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateUserMutation,
  useUpdateUserMutation,
} from "../store/usersApiSlice";
import { useGetAllStoresQuery } from "@/features/product_stores/store/productStoresApiSlice";
import { toast } from "sonner";

type UserFormData = {
  username: string;
  email: string;
  full_name: string;
  role: string;
  store_id?: string;
  location?: string;
};

type Props = {
  user?: any; // User to edit (undefined for new user)
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const UserFormDialog: React.FC<Props> = ({ user, open, onOpenChange }) => {
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const { data: storesData } = useGetAllStoresQuery({
    searchBy: "name",
    searchTerm: "",
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UserFormData>({
    defaultValues: user || {},
  });

  const selectedRole = watch("role");
  const stores = storesData?.data?.stores || [];

  useEffect(() => {
    if (user) {
      reset(user);
    } else {
      reset({
        username: "",
        email: "",
        full_name: "",
        role: "",
        store_id: "",
        location: "",
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: UserFormData) => {
    try {
      if (user) {
        await updateUser({ userId: user.id, payload: data }).unwrap();
        toast.success("User updated successfully");
      } else {
        const result = await createUser(data).unwrap();
        toast.success(
          `User created! Default password: ${result.data.default_password}`,
          { duration: 10000 }
        );
      }
      reset();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.data?.detail || "Failed to save user");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{user ? "Edit User" : "Create New User"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              {...register("username", { required: "Username is required" })}
            />
            {errors.username && (
              <span className="text-sm text-red-500">
                {errors.username.message}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register("email", { required: "Email is required" })}
            />
            {errors.email && (
              <span className="text-sm text-red-500">
                {errors.email.message}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              {...register("full_name", { required: "Full name is required" })}
            />
            {errors.full_name && (
              <span className="text-sm text-red-500">
                {errors.full_name.message}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setValue("role", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="store_agent">Store Agent</SelectItem>
                <SelectItem value="registration_officer">
                  Registration Officer
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <span className="text-sm text-red-500">
                {errors.role.message}
              </span>
            )}
          </div>

          {selectedRole === "registration_officer" && (
            <div className="space-y-2">
              <Label htmlFor="full_name">Office Location</Label>
              <Input
                id="location"
                {...register("location", {
                  required: "Full name is required",
                })}
              />
              {errors.location && (
                <span className="text-sm text-red-500">
                  {errors.location.message}
                </span>
              )}
            </div>
          )}

          {selectedRole === "store_agent" && (
            <div className="space-y-2">
              <Label htmlFor="store_id">Assign Store</Label>
              <Select
                value={watch("store_id")}
                onValueChange={(value) => setValue("store_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select store" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store: any) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name} - {store.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || isUpdating}>
              {isCreating || isUpdating ? "Saving..." : "Save User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserFormDialog;
