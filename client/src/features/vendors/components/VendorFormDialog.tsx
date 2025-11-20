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
import { toast } from "sonner";
import { useAddNewVendorMutation } from "../store/vendorsApiSlice";
import type { NewVendor, VendorItem } from "../types";
import { Pencil } from "lucide-react";

type Props = {
  vendor?: VendorItem | null;
  viewOnly?: boolean;
};

const VendorFormDialog: React.FC<Props> = ({ vendor, viewOnly = false }) => {
  const [open, setOpen] = React.useState(false);

  const [addNewVendor, { isLoading: isAdding }] = useAddNewVendorMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewVendor>({
    defaultValues: vendor
      ? {
          vendor_name: vendor.vendor_name,
          location: vendor.location,
          contact: vendor.contact,
        }
      : {},
  });

  const isEditMode = !!vendor;

  // ---------- FORM SUBMIT ----------
  const onSubmit = async (data: NewVendor) => {
    if (viewOnly) return;

    try {
      const res = await addNewVendor(data).unwrap();
      toast.success("Vendor added successfully!");
      reset();
      setOpen(false);
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Label htmlFor={name}>{label}</Label>
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
    <Dialog open={open} onOpenChange={setOpen}>
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
        className="w-[95vw] max-w-[650px] sm:max-w-[650px] 
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-2">
          {renderTextInput("vendor_name", "Vendor Name")}
          {renderTextInput("location", "Location")}
          {renderTextInput("contact", "Contact")}

          {!viewOnly && (
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isAdding}>
                {isAdding ? "Saving..." : "Save Vendor"}
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VendorFormDialog;
