import React, { useState } from "react";
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
import { useAddNewVendorSpocMutation } from "../store/vendorsApiSlice";
import type { VendorSpocItem, VendorItem } from "../types";
import { Pencil } from "lucide-react";
import VendorsCombobox from "./VendorsCombobox";

type Props = {
  vendorSpoc?: VendorSpocItem | null;
  viewOnly?: boolean;
};

type VendorSpocForm = {
  vendor_id: string;
  full_name: string;
  contact: string;
  photo?: File | null;
};

const VendorSpocFormDialog: React.FC<Props> = ({
  vendorSpoc,
  viewOnly = false,
}) => {
  const [open, setOpen] = React.useState(false);
  const [addNewVendorSpoc, { isLoading: isAdding }] =
    useAddNewVendorSpocMutation();
  const [photo, setPhoto] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VendorSpocForm>({
    defaultValues: vendorSpoc
      ? {
          vendor_id: vendorSpoc.vendor_id,
          full_name: vendorSpoc.full_name,
          contact: vendorSpoc.contact,
        }
      : {},
  });

  const onSubmit = async (data: VendorSpocForm) => {
    if (viewOnly) return;
    if (!data.vendor_id) {
      toast.error("Vendor is required");
      return;
    }
    if (!photo) {
      toast.error("Please select a photo");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("full_name", data.full_name);
      formData.append("contact", data.contact);
      formData.append("photo", photo);

      await addNewVendorSpoc({
        vendorId: data.vendor_id,
        formData,
      }).unwrap();

      toast.success("Vendor SPOC added successfully!");
      setOpen(false);
    } catch (err: any) {
      const errMsg =
        err?.data?.detail?.msg ??
        err?.data?.detail ??
        "Error adding Vendor SPOC";
      toast.error(errMsg);
    }
  };

  const renderTextInput = (
    name: keyof VendorSpocForm,
    label: string,
    type: string = "text",
    required = true
  ) => (
    <div className="grid gap-cols-1 sm:grid-cols-2 gap-3">
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {vendorSpoc ? (
          <Button variant="ghost" size="sm">
            <Pencil className="w-4 h-4" />
          </Button>
        ) : (
          <Button>Add Vendor SPOC</Button>
        )}
      </DialogTrigger>

      <DialogContent
        className="w-[95vw] max-w-[650px] sm:max-w-[650px] 
                          h-[90vh] sm:h-[80vh] overflow-auto 
                          mx-auto"
      >
        <DialogHeader>
          <DialogTitle>
            {viewOnly ? "View Vendor SPOC" : "Add Vendor SPOC"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-2">
          <VendorsCombobox
            value={watch("vendor_id")}
            onChange={(v: VendorItem) =>
              setValue("vendor_id", v.id, { shouldDirty: true })
            }
            disabled={viewOnly}
          />

          {renderTextInput("full_name", "Full Name")}
          {renderTextInput("contact", "Contact")}

          <div className="grid gap-cols-1 sm:grid-cols-2 gap-3">
            <Label htmlFor="photo">Photo</Label>
            <Input
              id="photo"
              type="file"
              accept="image/*"
              disabled={viewOnly}
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            />
          </div>

          {!viewOnly && (
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isAdding}>
                {isAdding ? "Saving..." : "Save Vendor SPOC"}
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VendorSpocFormDialog;
