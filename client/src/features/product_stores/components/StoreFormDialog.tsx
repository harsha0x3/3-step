// src/features/product_stores/components/StoreFormDialog.tsx
import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useAddNewStoreMutation,
  useUpdateStoreMutation,
} from "../store/productStoresApiSlice";
import type { NewStorePayload, StoreItemWithUser } from "../types";
import { toast } from "sonner";
import { flushSync } from "react-dom";
import MultiCityCombobox from "./MultiCityCombobox";

type Props = {
  store?: StoreItemWithUser;
  defOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const StoreFormDialog: React.FC<Props> = ({
  store,
  defOpen = false,
  onOpenChange,
}) => {
  const [open, setOpen] = React.useState(defOpen);
  const [addNewStore, { isLoading: isAdding }] = useAddNewStoreMutation();
  const [updateStore, { isLoading: isUpdating }] = useUpdateStoreMutation();

  const isEditMode = !!store;

  useEffect(() => {
    setOpen(defOpen);
  }, [defOpen]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, dirtyFields },
  } = useForm<NewStorePayload>({
    defaultValues: store
      ? {
          id: store.id ?? "",
          name: store.name,
          city_ids: store.city ? store.city.map((c) => c.id) : [],
          count: store.count ?? 0,
          email: store.email ?? "",
          mobile_number: store.mobile_number ?? "",
        }
      : {},
  });

  const closeAndGoBack = () => {
    flushSync(() => {
      setOpen(false);
      onOpenChange?.(false);
    });
  };

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
      closeAndGoBack();

      reset();
      setOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to save store");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        closeAndGoBack();
      }}
    >
      {/* <DialogTrigger asChild>
        {isEditMode ? (
          <Button variant="outline">Edit</Button>
        ) : (
          <Button>Add Store</Button>
        )}
      </DialogTrigger> */}

      <DialogContent className="">
        <DialogHeader>
          <DialogTitle className="text-center">
            {isEditMode ? "Edit Store Details" : "Add a New Store"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Store Code */}
          <div className="grid grid-cols-[130px_1fr] gap-2">
            <Label htmlFor="store_code">Store Code</Label>
            <Input
              id="store_code"
              {...register("id", {
                required: "Store Code is required",
              })}
              required
            />
            {errors.id && (
              <span className="text-sm text-red-500">{errors.id.message}</span>
            )}
          </div>
          {/* Store Cities */}
          <div className="grid grid-cols-[130px_1fr] gap-2">
            <Label>Cities</Label>

            <Controller
              name="city_ids"
              control={control}
              rules={{ required: "At least one city is required" }}
              render={({ field }) => (
                <MultiCityCombobox
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />

            {errors.city_ids && (
              <span className="text-sm text-red-500">
                {errors.city_ids.message}
              </span>
            )}
          </div>

          {/* Store Name */}
          <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-3">
            <Label htmlFor="name">Store Name</Label>
            <Input
              id="name"
              {...register("name", {
                required: "Store name is required",
              })}
              required
            />
            {errors.name && (
              <span className="text-sm text-red-500">
                {errors.name.message}
              </span>
            )}
          </div>
          {/* Count */}
          <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-3">
            <Label htmlFor="count">Total Stock</Label>
            <Input
              id="count"
              {...register("count", { required: true, valueAsNumber: true })}
              required
            />
            {errors.count && (
              <span className="text-sm text-red-500">
                {errors.count.message}
              </span>
            )}
          </div>
          {/* Store Email */}
          {/* <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-3">
            <Label htmlFor="address">Email</Label>
            <Input id="email" {...register("email", { required: true })} />
            {errors.email && (
              <span className="text-sm text-red-500">
                {errors.email.message}
              </span>
            )}
          </div> */}
          {/* Store Mobile_number */}
          {/* <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-3">
            <Label htmlFor="address">Mobile Number</Label>
            <Input
              id="mobile_number"
              required
              {...register("mobile_number", {
                required: `Mobile number is required`,
                pattern: {
                  value: /^\d{10}$/,
                  message: "Mobile number must be 10 digits",
                },
              })}
            />
            {errors.mobile_number && (
              <span className="text-sm text-red-500">
                {errors.mobile_number.message}
              </span>
            )}
          </div> */}
          <DialogFooter className="pt-4">
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant={"outline"}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isAdding || isUpdating}>
                {isAdding || isUpdating ? "Saving.." : "Save"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StoreFormDialog;
