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
import {
  useAddNewVendorSpocMutation,
  useUpdateVendorSpocMutation,
} from "../store/vendorsApiSlice";
import type { VendorSpocItem, VendorItem } from "../types";
import { Pencil } from "lucide-react";
import VendorsCombobox from "./VendorsCombobox";
import VendorSpocPhotoCapture from "./VendorSpocPhotoCapture";
import { DialogClose } from "@radix-ui/react-dialog";
import { flushSync } from "react-dom";

type Props = {
  vendorSpoc?: VendorSpocItem | null;
  viewOnly?: boolean;
  defOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type VendorSpocForm = {
  vendor_id: string;
  full_name: string;
  mobile_number?: string;
  photo?: File | null;
};

const VendorSpocFormDialog: React.FC<Props> = ({
  vendorSpoc,
  viewOnly = false,
  defOpen = false,
  onOpenChange,
}) => {
  const [open, setOpen] = React.useState(defOpen);
  const [addNewVendorSpoc, { isLoading: isAdding }] =
    useAddNewVendorSpocMutation();
  const [updateVendorSpoc, { isLoading: isUpdating }] =
    useUpdateVendorSpocMutation();

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

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
          mobile_number: vendorSpoc.mobile_number,
        }
      : {},
  });

  const handleCameraPhotoSubmit = async (formData: FormData) => {
    const file = formData.get("photo") as File;
    if (file) {
      setPhoto(file);
      if (file) setPhotoPreview(URL.createObjectURL(file));
      toast.success("Photo captured successfully!");
    }
  };

  const onSubmit = async (data: VendorSpocForm) => {
    if (viewOnly) return;
    if (!data.vendor_id) {
      toast.error("Vendor is required");
      return;
    }

    try {
      const formData = new FormData();
      if (data?.full_name) formData.append("full_name", data.full_name);
      if (data?.mobile_number)
        formData.append("mobile_number", data.mobile_number);
      if (photo) formData.append("photo", photo);
      if (!!vendorSpoc) {
        formData.append("vendor_id", data.vendor_id);
      }

      if (!vendorSpoc) {
        await addNewVendorSpoc({
          vendorId: data.vendor_id,
          formData,
        }).unwrap();
        toast.success("Vendor Contact Person added successfully!");
        setOpen(false);
        onOpenChange?.(true);
      } else {
        await updateVendorSpoc({
          vendorSpocId: vendorSpoc?.id,
          formData: formData,
        }).unwrap();
        toast.success("Vendor Contact Person details updated successfully!");
        setOpen(false);
        onOpenChange?.(true);
      }
    } catch (err: any) {
      const errMsg =
        err?.data?.detail?.msg ??
        err?.data?.detail ??
        "Error adding Vendor SPOC";
      toast.error(errMsg);
    }
  };

  const closeAndGoBack = (nextOpen) => {
    flushSync(() => {
      setOpen(false);
      onOpenChange?.(nextOpen);
    });
  };

  const renderTextInput = (
    name: keyof VendorSpocForm,
    label: string,
    type: string = "text",
    required = true
  ) => (
    <div className="grid gap-cols-1 sm:grid-cols-[200px_1fr] gap-0">
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
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        closeAndGoBack(nextOpen);
      }}
    >
      <DialogTrigger asChild>
        {vendorSpoc ? (
          <Button variant="ghost" size="sm">
            <Pencil className="w-4 h-4" />
          </Button>
        ) : (
          <Button>Add New</Button>
        )}
      </DialogTrigger>

      <DialogContent
        className="w-[95vw] max-w-[600px] sm:max-w-[600px] 
                           overflow-auto 
                          mx-auto"
      >
        <DialogHeader>
          <DialogTitle className="text-center">
            {!!vendorSpoc
              ? "Edit Vendor Contact Person Details"
              : "Add Vendor Contact Person"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-2">
          <div className="grid gap-cols-1 sm:grid-cols-[200px_1fr] gap-0">
            <Label>Vendor Name</Label>
            <VendorsCombobox
              value={watch("vendor_id")}
              onChange={(v: VendorItem) =>
                setValue("vendor_id", v.id, { shouldDirty: true })
              }
              disabled={viewOnly}
            />
          </div>

          {renderTextInput("full_name", "Full Name (of contact)")}
          {renderTextInput("mobile_number", "Phone")}

          <div className="grid gap-cols-1 sm:grid-cols-[200px_1fr] gap-0 items-start">
            <div className="flex flex-col gap-2">
              <Label htmlFor="photo">Photo</Label>
              {(photoPreview || vendorSpoc?.photo) && (
                <div className="flex flex-col ">
                  {/* <Label className="text-center">Photo Preview</Label> */}
                  <img
                    src={
                      photoPreview
                        ? photoPreview
                        : `${
                            import.meta.env.VITE_API_BASE_API_URL
                          }/hard_verify/api/v1.0/${vendorSpoc?.photo}`
                    }
                    alt="Selected Contact Photo"
                    className="w-32 h-32 object-cover rounded-md border-2"
                  />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-1 items-center">
                <Label
                  htmlFor="candidateFileInput"
                  className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer"
                >
                  Choose File
                </Label>
                <Input
                  id="candidateFileInput"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setPhoto(file);
                    if (file) setPhotoPreview(URL.createObjectURL(file));
                  }}
                  className="hidden"
                />
                <p>(OR)</p>
                <VendorSpocPhotoCapture onSubmit={handleCameraPhotoSubmit} />
              </div>
            </div>
          </div>

          {!viewOnly && (
            <DialogFooter className="pt-4">
              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button variant={"outline"}>Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isAdding}>
                  {isAdding ? "Saving..." : "Save"}
                </Button>
              </div>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VendorSpocFormDialog;
