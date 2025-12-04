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
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  useAddNewVendorMutation,
  useUpdateVendorMutation,
} from "../store/vendorsApiSlice";
import type { NewVendor, VendorItem } from "../types";
import { CircleQuestionMarkIcon, Pencil } from "lucide-react";
import { flushSync } from "react-dom";

type Props = {
  vendor?: VendorItem | null;
  viewOnly?: boolean;
  defOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const VendorFormDialog: React.FC<Props> = ({
  vendor,
  viewOnly = false,
  defOpen = false,
  onOpenChange,
}) => {
  const [open, setOpen] = React.useState(defOpen);

  const [addNewVendor, { isLoading: isAdding }] = useAddNewVendorMutation();
  const [updateVendor, { isLoading: isUpdating }] = useUpdateVendorMutation();

  const closeAndGoBack = (nextOpen: bool) => {
    flushSync(() => {
      setOpen(false);
      onOpenChange?.(nextOpen);
    });
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewVendor>({
    defaultValues: vendor
      ? {
          vendor_name: vendor.vendor_name,
          vendor_owner: vendor.vendor_owner,
          mobile_number: vendor.mobile_number,
        }
      : {},
  });

  const isEditMode = !!vendor;

  // ---------- FORM SUBMIT ----------
  const onSubmit = async (data: NewVendor) => {
    if (viewOnly) return;

    try {
      if (!vendor) {
        const res = await addNewVendor(data).unwrap();
        toast.success("Vendor added successfully!");
        reset();
        setOpen(false);
        onOpenChange?.(true);
      } else {
        await updateVendor({ vendorId: vendor?.id, payload: data }).unwrap();
        toast.success("Vendor details updated successfully!");
      }
    } catch (err: any) {
      const errMsg: string =
        err?.data?.detail?.msg ?? err?.data?.detail ?? "Error adding vendor";
      toast.error(errMsg);
    }
  };

  // ---------- RENDER TEXT INPUT ----------
  const renderTextInput = (
    name: keyof NewVendor,
    label: string,
    type: string = "text",
    required = true
  ) => (
    <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-0">
      <Label htmlFor={name}>
        {label} {required && <span className="text-red-500"> *</span>}
      </Label>
      <Input
        id={name}
        type={type}
        readOnly={viewOnly}
        {...register(
          name,
          required ? { required: `${label} is required` } : {}
        )}
      />
      {errors[name] && (
        <span className="text-sm text-red-500">
          {errors[name]?.message as string}
        </span>
      )}
    </div>
  );

  // ---------- JSX ----------
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        closeAndGoBack(nextOpen);
      }}
    >
      <DialogTrigger asChild>
        {isEditMode ? (
          <Button variant="ghost" size="sm">
            <Pencil className="w-4 h-4" />
          </Button>
        ) : (
          <Button>Add Vendor</Button>
        )}
      </DialogTrigger>

      <DialogContent
        className="w-[95vw] max-w-[550px] sm:max-w-[550px] 
                          overflow-auto 
                          mx-auto"
      >
        <DialogHeader>
          <DialogTitle>
            {viewOnly
              ? "View Vendor"
              : isEditMode
              ? "Edit Vendor"
              : "Add New Vendor"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 py-2">
          {renderTextInput("vendor_name", "Vendor Name")}
          {renderTextInput("vendor_owner", "Owner Name")}

          {renderTextInput(
            "mobile_number",
            "Owner Mobile Number",
            "text",
            false
          )}

          {!viewOnly && (
            <DialogFooter className="pt-4">
              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button variant={"outline"}>Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isAdding}>
                  {isAdding ? "Saving..." : isUpdating ? "Updating..." : "Save"}
                </Button>
              </div>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VendorFormDialog;
