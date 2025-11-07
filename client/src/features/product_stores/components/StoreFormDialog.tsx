// src/features/product_stores/components/StoreFormDialog.tsx
import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useAddNewStoreMutation,
  useUpdateStoreMutation,
} from "../store/productStoresApiSlice";
import type { NewStorePayload, StoreItemWithUser } from "../types";
import { toast } from "sonner";

type Props = {
  store?: StoreItemWithUser;
};

const StoreFormDialog: React.FC<Props> = ({ store }) => {
  const [open, setOpen] = React.useState(false);
  const [addNewStore, { isLoading: isAdding }] = useAddNewStoreMutation();
  const [updateStore, { isLoading: isUpdating }] = useUpdateStoreMutation();

  const isEditMode = !!store;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<NewStorePayload>({
    defaultValues: store
      ? {
          store_name: store.store_name,
          store_person_first_name: store.store_person?.first_name ?? "",
          store_person_last_name: store.store_person?.last_name ?? "",
          email: store.email ?? "",
          store_contact_number: store.contact_number ?? "",
          address: store.address ?? "",
          city: store.city ?? "",
          state: store.state ?? "",
          maps_link: store.maps_link ?? "",
        }
      : {},
  });

  const onSubmit = async (data: NewStorePayload) => {
    try {
      if (isEditMode) {
        // collect only dirty fields
        const dirty = Object.keys(dirtyFields);
        const payload: Partial<NewStorePayload> = {};
        for (const key of dirty) {
          // @ts-expect-error - dynamic key access
          payload[key] = data[key];
        }

        if (Object.keys(payload).length === 0) {
          toast.info("No changes detected.");
          return;
        }

        await updateStore({ storeId: store!.id, payload }).unwrap();
        toast.success("Store updated successfully!");
      } else {
        await addNewStore(data).unwrap();
        toast.success("Store created successfully!");
      }

      reset();
      setOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.data?.detail ?? "Failed to save store");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditMode ? (
          <Button variant="outline">Edit</Button>
        ) : (
          <Button>Create Store</Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Store Details" : "Add a New Store"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Store Name */}
          <div className="grid gap-1">
            <Label htmlFor="store_name">Store Name</Label>
            <Input
              id="store_name"
              {...register("store_name", {
                required: "Store name is required",
              })}
            />
            {errors.store_name && (
              <span className="text-sm text-red-500">
                {errors.store_name.message}
              </span>
            )}
          </div>

          {/* Store Person First & Last Name */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="store_person_first_name">First Name</Label>
              <Input
                id="store_person_first_name"
                {...register("store_person_first_name", {
                  required: "First name is required",
                })}
              />
              {errors.store_person_first_name && (
                <span className="text-sm text-red-500">
                  {errors.store_person_first_name.message}
                </span>
              )}
            </div>
            <div>
              <Label htmlFor="store_person_last_name">Last Name</Label>
              <Input
                id="store_person_last_name"
                {...register("store_person_last_name", {
                  required: "Last name is required",
                })}
              />
              {errors.store_person_last_name && (
                <span className="text-sm text-red-500">
                  {errors.store_person_last_name.message}
                </span>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="grid gap-1">
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

          {/* Contact Number */}
          <div className="grid gap-1">
            <Label htmlFor="store_contact_number">Contact Number</Label>
            <Input
              id="store_contact_number"
              {...register("store_contact_number", {
                required: "Contact number is required",
              })}
            />
            {errors.store_contact_number && (
              <span className="text-sm text-red-500">
                {errors.store_contact_number.message}
              </span>
            )}
          </div>

          {/* Address */}
          <div className="grid gap-1">
            <Label htmlFor="address">Address</Label>
            <Input id="address" {...register("address", { required: true })} />
          </div>

          {/* city & State */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="city">city</Label>
              <Input
                id="city"
                {...register("city", { required: "city is required" })}
              />
              {errors.city && (
                <span className="text-sm text-red-500">
                  {errors.city.message}
                </span>
              )}
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                {...register("state", { required: "State is required" })}
              />
              {errors.state && (
                <span className="text-sm text-red-500">
                  {errors.state.message}
                </span>
              )}
            </div>
          </div>

          {/* Maps link (optional) */}
          <div className="grid gap-1">
            <Label htmlFor="maps_link">Maps Link</Label>
            <Input id="maps_link" {...register("maps_link")} />
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" disabled={isAdding || isUpdating}>
              {isAdding || isUpdating
                ? isEditMode
                  ? "Saving..."
                  : "Creating..."
                : isEditMode
                ? "Save Changes"
                : "Create Store"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StoreFormDialog;
