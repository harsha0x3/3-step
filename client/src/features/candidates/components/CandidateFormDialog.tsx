import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  useAddCandidateAadharMutation,
  useAddNewCandidateMutation,
  useResetVoucherIssuanceMutation,
  useUpdateCandidateMutation,
  useUploadCandidatePhotoMutation,
} from "../store/candidatesApiSlice";
import type {
  NewCandidatePayload,
  CandidateItemWithStore,
  UpdateCandidatePayload,
} from "../types";
import {
  CircleQuestionMarkIcon,
  EyeIcon,
  Loader,
  Loader2Icon,
  TicketCheckIcon,
} from "lucide-react";
import { useSelector } from "react-redux";
import { selectAuth } from "@/features/auth/store/authSlice";
import StoresCombobox from "@/features/product_stores/components/StoresCombobox";
import VendorSpocCombobox from "@/features/vendors/components/VendorSpocCombobox";
import CandidatePhotoCapture from "./CandidatePhotoCapture";
import AadharPhotoCapture from "./AadharPhotoCapture";
import Hint from "@/components/ui/hint";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { flushSync } from "react-dom";

import type { StoreItemWithUser } from "@/features/product_stores/types";
import VoucherSuccessDialog from "./VoucherSuccessDialog";
import { compressImage } from "@/utils/imgCompressor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Props = {
  store_id?: string;
  candidate?: CandidateItemWithStore | null;
  viewOnly?: boolean;
  toVerify?: boolean;
  defOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const CandidateFormDialog: React.FC<Props> = ({
  store_id,
  candidate,
  viewOnly = false,
  toVerify = false,
  defOpen = false,
  onOpenChange,
}) => {
  const [open, setOpen] = React.useState(defOpen);
  const [showVerifyConfirm, setShowVerifyConfirm] = useState<boolean>(false);
  const [selectedStore, setSelectedStore] = useState<StoreItemWithUser | null>(
    null
  );
  const [showResetIssuanceAlert, setShowResetIssuanceAlert] = useState(false);
  useEffect(() => {
    if (candidate?.store) {
      setSelectedStore(candidate.store); // assuming backend returns store object
    }
  }, [candidate]);

  const [addNewCandidate, { isLoading: isAdding }] =
    useAddNewCandidateMutation();

  const [updateCandidate, { isLoading: isUpdating }] =
    useUpdateCandidateMutation();
  const [uploadPhoto, { isLoading: isUploadingPhoto }] =
    useUploadCandidatePhotoMutation();
  const [addAadharPhoto, { isLoading: isUploadingAadhar }] =
    useAddCandidateAadharMutation();
  const [resetVoucherIssuance, { isLoading: resettingVoucherIssuance }] =
    useResetVoucherIssuanceMutation();
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [openConfirm, setOpenConfirm] = useState<boolean>(false);
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);

  const currentUserInfo = useSelector(selectAuth);
  const canEdit =
    !!candidate &&
    (currentUserInfo.role === "admin" ||
      currentUserInfo.role === "super_admin" ||
      currentUserInfo.role === "registration_officer");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm<NewCandidatePayload>({
    defaultValues: candidate
      ? {
          id: candidate.id,
          full_name: candidate.full_name,
          mobile_number: candidate.mobile_number,
          city: candidate.city,
          state: candidate.state,
          division: candidate.division,
          aadhar_number: candidate.aadhar_number,

          store_id: candidate.store_id,
          vendor_spoc_id: candidate.vendor_spoc_id,
          is_candidate_verified: candidate.is_candidate_verified,
        }
      : { store_id: store_id || "" },
  });

  useEffect(() => {
    if (defOpen) setOpen(true);
  }, [defOpen]);

  const isVerifiedChecked = watch("is_candidate_verified");
  const closeAndGoBack = () => {
    flushSync(() => {
      setOpen(false);
      onOpenChange?.(false);
    });

    navigate("/registration_officer/beneficiary/verify");
  };

  const isMaskedAadhar = (value: string) => {
    if (value) return value.toLowerCase().includes("x");
    return false;
  };

  // ---------- FORM SUBMIT HANDLERS ----------
  const onSubmit = async (data: NewCandidatePayload) => {
    console.log("IMN SIDE ON SUBMI");
    if (viewOnly) return;

    try {
      // ===== EDIT MODE =====
      if (isEditMode) {
        // Never allow verified flag to change in edit mode
        if (candidate && isMaskedAadhar(data.aadhar_number)) {
          console.log("YES IT IS MASKED");
          delete data.aadhar_number;
        }
        delete data.is_candidate_verified;

        await updateCandidate({
          candidateId: candidate.id,
          payload: data,
        }).unwrap();

        toast.success("Beneficiary details updated successfully!");
        setIsEditMode(false);
        return;
      }

      // ===== VERIFY / ISSUE VOUCHER MODE =====
      if (toVerify && candidate) {
        if (!isVerifiedChecked) {
          toast.error("Please verify details before issuing voucher");
          return;
        }

        await updateCandidate({
          candidateId: candidate.id,
          payload: {
            is_candidate_verified: true,
          },
        }).unwrap();

        toast.success("Voucher issued successfully!");
        setShowSuccess(true);
        // closeAndGoBack();
        return;
      }

      // ===== ADD MODE =====
      if (!candidate) {
        await addNewCandidate(data).unwrap();
        toast.success("Beneficiary added successfully!");
        closeAndGoBack();
      }

      reset();
    } catch (err: unknown) {
      console.error("Error in ben sub", err);

      const errMsg =
        err?.data?.detail?.msg ?? err?.data?.detail ?? "Something went wrong";

      const errDesc = err?.data?.detail?.msg
        ? err?.data?.detail?.err_stack
        : "";

      toast.error(errMsg, { description: errDesc });
    }
  };

  const mode = isEditMode
    ? "edit"
    : viewOnly
    ? "view"
    : toVerify
    ? "verify"
    : candidate
    ? "view"
    : "add";

  useEffect(() => {
    if (candidate) {
      reset({
        id: candidate.id,
        full_name: candidate.full_name,
        mobile_number: candidate.mobile_number,
        city: candidate.city,
        state: candidate.state,
        division: candidate.division,
        aadhar_number: candidate.aadhar_number,

        store_id: candidate.store_id,
        vendor_spoc_id: candidate.vendor_spoc_id,
        is_candidate_verified: candidate.is_candidate_verified,
      });
    }
  }, [candidate, reset]);

  const handleImageUpload = async (
    type: "aadhar" | "candidate",
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();
    let file = e.target.files?.[0];
    if (!file) return;
    file = await compressImage(file, 1.5);
    const formData = new FormData();
    formData.append("photo", file);

    try {
      if (type === "candidate") {
        await uploadPhoto({
          candidateId: candidate?.id,
          formData,
        }).unwrap();
        toast.success("photo uploaded successfully");
      } else if (type === "aadhar") {
        await addAadharPhoto({
          candidateId: candidate?.id,
          formData,
        }).unwrap();
        toast.success(`Aadhaar photo uploaded successfully`);
      }
    } catch (err: unknown) {
      const errMsg: string =
        err?.data?.detail?.msg ?? err?.data?.detail ?? "Error uploading photo";

      const errDesc = err?.data?.detail?.msg
        ? err?.data?.detail?.err_stack
        : "";
      toast.error(errMsg, { description: errDesc });
    }
  };

  const resetIssuanceOfVoucher = async () => {
    try {
      await resetVoucherIssuance({ candidateId: candidate.id }).unwrap();
      toast.success("Resetting of Voucher Issuance completed");
    } catch (err) {
      const errMsg: string =
        err?.data?.detail?.msg ??
        err?.data?.detail ??
        "Error resetting voucher issuance";
      toast.error(errMsg);
    }
  };

  // ---------- JSX ----------
  const renderTextInput = (
    name: keyof NewCandidatePayload,
    label: string,
    type: string = "text",
    required = currentUserInfo.role !== "super_admin",
    isReadOnly = false
  ) => (
    <div className="grid grid-cols-1 sm:grid-cols-[250px_1fr] gap-0">
      <Label className="font-semibold text-md flex gap-2" htmlFor={name}>
        {label}
        {required && <span className="text-red-600">*</span>}
      </Label>
      <Input
        id={name}
        type={type}
        readOnly={viewOnly || (!isEditMode && !!candidate) || isReadOnly}
        {...register(
          name,
          required ? { required: `${label} is required` } : {}
        )}
        className={`${errors[name] ? "border-red-500 " : ""}`}
      />
      {errors[name] && (
        <span className="text-sm text-red-600">
          {errors[name]?.message as string}
        </span>
      )}
    </div>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        onOpenChange?.(isOpen); // notify parent
      }}
    >
      <DialogTrigger asChild>
        {!!candidate && !toVerify ? (
          <Hint label="View Beneficiary details">
            <Button variant="ghost" size="sm">
              <EyeIcon className="w-4 h-4" />
            </Button>
          </Hint>
        ) : !!candidate && toVerify ? (
          <Button disabled={!isVerifiedChecked}>Issue Voucher</Button>
        ) : (
          <Button>{viewOnly ? "View Beneficiary" : "Add Beneficiary"}</Button>
        )}
      </DialogTrigger>

      <DialogContent
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
        className="w-[95vw] max-w-[650px] sm:max-w-[650px] 
                          h-[90vh] sm:h-[98vh] overflow-hidden 
                          mx-auto flex flex-col"
      >
        <ScrollArea className="flex-1 overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-3 text-lg font-semibold text-center">
              {viewOnly
                ? "View Beneficiary Details"
                : toVerify
                ? "Beneficiary Details"
                : isEditMode || !!candidate
                ? "Edit Beneficiary Details"
                : "Add New Beneficiary"}

              {candidate?.is_candidate_verified && (
                <span className="text-green-400 bg-green-100 rounded flex gap-2 items-center px-2 py-1 text-sm">
                  <TicketCheckIcon className="w-4 h-4" /> Voucher Issued
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription asChild>
            <div className="pt-4">
              {viewOnly ? (
                "View Beneficiary"
              ) : toVerify ? (
                <ol className="text-muted-foreground">
                  <li>
                    Aadhaar Number and beneficiary photo will be used to verify
                    beneficiary at the time of issuing laptop at store
                  </li>
                </ol>
              ) : (
                ""
              )}
            </div>
          </DialogDescription>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5 py-2 overflow-auto"
            id="candidate-form"
          >
            {openConfirm && (
              <Dialog open={openConfirm} onOpenChange={setOpenConfirm}>
                <DialogContent>
                  <DialogHeader>
                    Are you sure you want to cancel editing?
                  </DialogHeader>

                  <DialogDescription>
                    You will lose all unsaved data. Click{" "}
                    <strong>Save & Exit</strong> to save & exit, or{" "}
                    <strong>Cancel</strong> to discard changes.
                  </DialogDescription>

                  <div className="flex items-center justify-end gap-3">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => {
                        setIsEditMode(false);
                        if (candidate) {
                          reset({
                            id: candidate.id,
                            full_name: candidate.full_name,
                            mobile_number: candidate.mobile_number,
                            city: candidate.city,
                            state: candidate.state,
                            division: candidate.division,
                            aadhar_number: candidate.aadhar_number,
                            store_id: candidate.store_id,
                            vendor_spoc_id: candidate.vendor_spoc_id,
                            is_candidate_verified:
                              candidate.is_candidate_verified,
                          });
                        } else {
                          reset();
                        }
                        setOpenConfirm(false);
                      }}
                    >
                      Cancel Editing
                    </Button>

                    <Button
                      type="button"
                      onClick={() => {
                        handleSubmit(onSubmit)();
                        setOpenConfirm(false);
                      }}
                      disabled={isUpdating}
                    >
                      {isUpdating ? "Saving..." : "Save & Exit"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            <section className="flex flex-col gap-4">
              {renderTextInput("id", "Employee ID", "text", true)}
              {renderTextInput("full_name", "Full Name")}
              <div className="grid grid-cols-1 sm:grid-cols-[250px_1fr] gap-0">
                <Label
                  className="font-semibold text-md flex gap-2"
                  htmlFor={"mobile_number"}
                >
                  Mobile Number<span className="text-red-600">*</span>
                </Label>
                <Input
                  id={"mobile_number"}
                  type="tel"
                  minLength={10}
                  maxLength={10}
                  className={`${errors.mobile_number ? "border-red-500 " : ""}`}
                  onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                    e.target.value = e.target.value.replace(/\D/g, "");
                  }}
                  readOnly={
                    viewOnly ||
                    (!isEditMode && !!candidate) ||
                    (isEditMode || !candidate
                      ? false
                      : toVerify && !!candidate?.mobile_number)
                  }
                  {...register("mobile_number", {
                    required:
                      currentUserInfo.role !== "super_admin"
                        ? "Mobile number is missing, enter it."
                        : false,
                    pattern: {
                      value: /^\d{10}$/,
                      message: "Mobile number must be 10 digits",
                    },
                  })}
                />
                {errors.mobile_number && (
                  <span className="text-sm text-red-600">
                    {errors.mobile_number?.message as string}
                  </span>
                )}
              </div>
              {renderTextInput("city", "City", "text", false)}
              {renderTextInput("state", "State", "text", false)}
              {renderTextInput("division", "Division", "text", false)}
              <div className="grid grid-cols-1 sm:grid-cols-[250px_1fr] gap-0">
                <Label
                  className="font-semibold text-md flex gap-2"
                  htmlFor="aadhar_number"
                >
                  Aadhaar Number<span className="text-red-600">*</span>
                </Label>
                <Controller
                  name="aadhar_number"
                  control={control}
                  rules={{
                    required:
                      currentUserInfo.role !== "super_admin"
                        ? "Aadhaar number is missing, enter it"
                        : false,
                    validate: (value) =>
                      isMaskedAadhar
                        ? true
                        : value.replace(/\s/g, "").length === 12 ||
                          "Aadhar Number must be exactly 12 digits",
                  }}
                  render={({ field, fieldState }) => {
                    // Format for display with dashes
                    const formatWithDashes = (val: string) =>
                      val.replace(/(\d{4})(?=\d)/g, "$1-");

                    // Mask Aadhaar for display when not editing
                    const maskAadhaar = (val: string) =>
                      val
                        .replace(/\d(?=\d{4})/g, "x")
                        .replace(/(\d{4})(?=\d)/g, "$1-");

                    const handleChange = (
                      e: React.ChangeEvent<HTMLInputElement>
                    ) => {
                      if (!isEditMode) return;

                      // Only strip non-digits when typing
                      const digits = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 12);
                      field.onChange(digits);
                    };

                    return (
                      <Input
                        {...field}
                        id="aadhar_number"
                        readOnly={
                          viewOnly ||
                          (!isEditMode && !!candidate) ||
                          (isEditMode || !candidate
                            ? false
                            : toVerify && !!candidate?.aadhar_number)
                        }
                        value={
                          isEditMode
                            ? formatWithDashes(field.value || "")
                            : maskAadhaar(field.value || "")
                        }
                        onChange={handleChange}
                        className={`${
                          fieldState.invalid ? "border-red-500 " : ""
                        }`}
                      />
                    );
                  }}
                />

                {/* <Input
                  id="aadhar_number"
                  className={`${errors.aadhar_number ? "border-red-500 " : ""}`}
                  readOnly={
                    viewOnly ||
                    (!isEditMode && !!candidate) ||
                    (isEditMode || !candidate
                      ? false
                      : toVerify && !!candidate?.aadhar_number)
                  }
                  {...register("aadhar_number", {
                    required: currentUserInfo.role !== "super_admin",
                    onChange: (e) => {
                      if (!isEditMode) return;

                      // Remove non-digit characters
                      const plain = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 12);
                      // Format for display with dashes
                      const formatted = plain.replace(/(\d{4})(?=\d)/g, "$1-");

                      // Update the input field for the user
                      e.target.value = formatted;

                      // Send only plain digits to the form value (React Hook Form)
                      setValue("aadhar_number", plain, {
                        shouldValidate: true,
                      });
                    },
                  })}
                /> */}
                {errors.aadhar_number && (
                  <span className="text-sm text-red-600">
                    {errors.aadhar_number?.message as string}
                  </span>
                )}
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <Controller
                name="store_id"
                control={control}
                rules={{
                  required:
                    currentUserInfo.role !== "super_admin"
                      ? "Allot a store."
                      : false,
                }}
                render={({ field, fieldState }) => (
                  <div>
                    <div className="grid grid-cols-1 sm:grid-cols-[250px_1fr] gap-0">
                      <div>
                        <Label className="font-semibold text-md flex ">
                          Store<span className="text-red-500">*</span>
                        </Label>
                        {fieldState.invalid && (
                          <p className="text-red-500 text-sm">
                            {fieldState.error.message}
                          </p>
                        )}
                      </div>
                      <StoresCombobox
                        value={field.value}
                        onChange={(store) => {
                          field.onChange(store.id);
                          setSelectedStore(store);
                        }}
                        className={`${
                          fieldState.invalid ? "border-red-500 " : ""
                        }`}
                        isDisabled={!isEditMode && !!candidate}
                      />
                    </div>
                  </div>
                )}
              />

              {!!candidate && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-[250px_1fr] gap-0">
                    <div>
                      <Label className="font-semibold text-md flex ">
                        Vendor Contact Person
                        <span className="text-red-500">*</span>
                      </Label>
                      {!!candidate && toVerify && (
                        <div className="flex gap-2 items-center pt-2">
                          <Hint label="Add a new Vendor Contact if it doesn’t exist in the list.">
                            <CircleQuestionMarkIcon className="w-3 h-5 text-amber-600" />
                          </Hint>
                          <Button
                            type="button"
                            onClick={() => navigate("/vendor_spoc/new")}
                            size="sm"
                          >
                            Add new
                          </Button>
                        </div>
                      )}
                    </div>
                    <div>
                      <Controller
                        name="vendor_spoc_id"
                        control={control}
                        rules={{
                          required:
                            currentUserInfo.role !== "super_admin"
                              ? "Vendor contact person is required"
                              : false,
                        }}
                        render={({ field, fieldState }) => (
                          <div>
                            <VendorSpocCombobox
                              value={field.value}
                              onChange={(vendor_spoc) => {
                                field.onChange(vendor_spoc?.id);
                              }}
                              isDisabled={!isEditMode}
                            />

                            {fieldState.invalid && (
                              <p className="text-red-500 text-sm">
                                {fieldState.error.message}
                              </p>
                            )}
                          </div>
                        )}
                      />
                    </div>
                  </div>
                </>
              )}
            </section>

            {!!candidate && (
              <>
                {/* <div className="grid grid-cols-1 sm:grid-cols-[250px_1fr] gap-0">
                  <Label className="font-semibold text-md">Voucher Code</Label>
                  <Input
                    type="text"
                    readOnly
                    value={candidate?.coupon_code ?? "Error getting"}
                  />
                </div> */}
                {!isEditMode && (
                  <div
                    className={`border-t mt-4 pt-4 space-y-4 flex w-full ${
                      !!candidate && toVerify
                        ? "flex-col"
                        : "flex-row justify-between gap-3"
                    }`}
                  >
                    {/* Candidate Photo */}
                    <div
                      className={`border relative p-2 ${
                        !!candidate && toVerify ? "" : "w-1/2"
                      }`}
                    >
                      <p className="absolute -translate-y-5 bg-background rounded px-2">
                        Beneficiary Photo
                      </p>
                      {!!candidate && toVerify && (
                        <p className="flex gap-3 items-center text-amber-700">
                          <span>
                            <CircleQuestionMarkIcon className="w-3 h-3 text-blue-600" />
                          </span>
                          Capture / upload the photo of beneficiary
                        </p>
                      )}

                      <div className="flex items-center gap-3">
                        {candidate?.photo ? (
                          <img
                            src={`${
                              import.meta.env.VITE_API_BASE_API_URL
                            }/hard_verify/api/v1.0/secured_file?path=${encodeURIComponent(
                              candidate?.photo
                            )}`}
                            alt="Candidate"
                            className="w-30 h-30 object-cover rounded-md border"
                          />
                        ) : (
                          <div className="w-30 h-30 border rounded-md flex items-center justify-center text-gray-400">
                            No Photo
                          </div>
                        )}
                        {!!candidate &&
                          toVerify &&
                          (currentUserInfo.role === "admin" ||
                            currentUserInfo.role === "super_admin" ||
                            currentUserInfo.role === "registration_officer") &&
                          !(
                            candidate.is_candidate_verified &&
                            !["super_admin"].includes(currentUserInfo.role)
                          ) && (
                            <div className="flex gap-3 items-center">
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
                                  onChange={(e) =>
                                    handleImageUpload("candidate", e)
                                  }
                                  className="hidden"
                                  disabled={
                                    candidate.is_candidate_verified &&
                                    !["super_admin"].includes(
                                      currentUserInfo.role
                                    )
                                  }
                                />
                                {isUploadingPhoto && (
                                  <Loader className="w-3 h-3 animate-spin" />
                                )}
                              </div>
                              <p>(OR)</p>

                              <CandidatePhotoCapture
                                candidateId={candidate?.id}
                              />
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Aadhar photo */}
                    <div
                      className={`border relative p-2 ${
                        !!candidate && toVerify ? "" : "w-1/2"
                      }`}
                    >
                      <p className="absolute -translate-y-5 bg-background rounded px-2">
                        Beneficiary's Aadhaar card photo.
                      </p>
                      {!!candidate && toVerify && (
                        <p className="flex gap-3 items-center text-amber-700">
                          <Hint
                            label={
                              "Take a photo of beneficiary's aadhaar for future proof with number clearly visible."
                            }
                          >
                            <span>
                              <CircleQuestionMarkIcon className="w-3 h-3 text-blue-600" />
                            </span>
                          </Hint>
                          Capture /upload the photo of beneficiary's aadhaar
                          card
                        </p>
                      )}
                      <div className="flex items-center gap-3">
                        {candidate?.aadhar_photo ? (
                          <img
                            src={`${
                              import.meta.env.VITE_API_BASE_API_URL
                            }/hard_verify/api/v1.0/secured_file?path=${encodeURIComponent(
                              candidate?.aadhar_photo
                            )}`}
                            alt="Candidate"
                            className="w-30 h-30 object-cover rounded-md border"
                          />
                        ) : (
                          <div className="w-30 h-30 border rounded-md flex items-center justify-center text-gray-400">
                            No Aadhaar
                          </div>
                        )}
                        {!!candidate &&
                          toVerify &&
                          (currentUserInfo.role === "admin" ||
                            currentUserInfo.role === "super_admin" ||
                            currentUserInfo.role === "registration_officer") &&
                          !(
                            candidate.is_candidate_verified &&
                            !["super_admin"].includes(currentUserInfo.role)
                          ) && (
                            <div className="flex gap-3 items-center">
                              <div className="flex gap-1 items-center">
                                <Label
                                  htmlFor="aadharFileInput"
                                  className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer"
                                >
                                  Choose File
                                </Label>
                                <Input
                                  id="aadharFileInput"
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) =>
                                    handleImageUpload("aadhar", e)
                                  }
                                  className="hidden"
                                  disabled={
                                    candidate.is_candidate_verified &&
                                    !["super_admin"].includes(
                                      currentUserInfo.role
                                    )
                                  }
                                />
                                {isUploadingPhoto && (
                                  <Loader className="w-3 h-3 animate-spin" />
                                )}
                                {isUploadingAadhar && (
                                  <Loader className="w-3 h-3 animate-spin" />
                                )}
                              </div>
                              <p>(OR)</p>

                              <AadharPhotoCapture candidateId={candidate?.id} />
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {toVerify && !isEditMode && !isAdding && (
              <div className="flex items-center gap-3 mt-2">
                <Hint label="Check the box if all the details have been filled and verified.">
                  <Input
                    type="checkbox"
                    id="is_candidate_verified"
                    {...register("is_candidate_verified")}
                    disabled={
                      (viewOnly || candidate.is_candidate_verified) &&
                      currentUserInfo.role !== "super_admin"
                    }
                    className="w-7 h-7 hover:cursor-pointer"
                  />
                </Hint>
                <Label
                  className="font-semibold text-md"
                  htmlFor="is_candidate_verified"
                >
                  Beneficiary Details Verified
                </Label>
                <p className="flex gap-3">
                  <CircleQuestionMarkIcon className="w-3 h-3 text-blue-600" />
                  Check the box if all the details of employee is verified.
                </p>
              </div>
            )}
          </form>
        </ScrollArea>
        {/* Verification Confirmation Dialog */}
        <Dialog open={showVerifyConfirm} onOpenChange={setShowVerifyConfirm}>
          <DialogContent
            onInteractOutside={(e) => {
              e.preventDefault();
            }}
          >
            <DialogHeader>
              <DialogTitle className="text-center">Confirmation</DialogTitle>
              <DialogDescription>
                Verify the details before proceeding:
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-[120px_1fr] gap-3">
                <span className="font-semibold">Full Name</span>
                <span>{watch("full_name")}</span>

                <span className="font-semibold">Mobile Number</span>
                <span>{watch("mobile_number")}</span>

                <span className="font-semibold">Employee ID</span>
                <span>{watch("id")}</span>

                <span className="font-semibold">Gift Card Code</span>
                <span className="text-lg font-bold">
                  {candidate?.gift_card_code ?? "-"}
                </span>

                <span className="font-semibold">Aadhaar Number</span>
                <span>{watch("aadhar_number")}</span>
                <span className="font-semibold">Store</span>
                <div className="flex flex-col">
                  {selectedStore ? (
                    <>
                      <span className="font-medium">{selectedStore.name}</span>

                      <span className="text-xs text-muted-foreground">
                        {[selectedStore.city.map((c) => c.name)].join(", ")}
                      </span>
                      <p className="text-xs text-muted-foreground whitespace-break-spaces wrap-break-word">
                        {selectedStore.address}
                      </p>
                    </>
                  ) : (
                    <span className="text-red-500">No store selected</span>
                  )}
                </div>
              </div>

              <p className="mt-3 text-amber-700 font-medium">
                Are you sure everything is correct and you want to proceed?
              </p>
            </div>

            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setShowVerifyConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowVerifyConfirm(false);
                  document.getElementById("candidate-form")?.requestSubmit(); // ⬅ submits original form
                }}
              >
                Ok
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {showSuccess && (
          <VoucherSuccessDialog open={showSuccess} setOpen={setShowSuccess} />
        )}

        {!viewOnly && (
          <DialogFooter className="w-full">
            <div className="flex justify-center gap-2 items-center w-full">
              {/* Left side — secondary actions */}
              <div>
                {(mode === "view" || mode === "verify") && canEdit && (
                  <Hint
                    label={
                      candidate.is_candidate_verified &&
                      !["super_admin"].includes(currentUserInfo.role)
                        ? "Cannot edit details after issuing voucher, Please contact admin"
                        : "Edit beneficiary details."
                    }
                  >
                    <div>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setIsEditMode(true)}
                        disabled={
                          candidate.is_candidate_verified &&
                          !["super_admin"].includes(currentUserInfo.role)
                        }
                      >
                        Edit Details
                      </Button>
                    </div>
                  </Hint>
                )}

                {mode === "edit" && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setOpenConfirm(true)}
                  >
                    Discard Changes
                  </Button>
                )}
              </div>
              {candidate &&
                candidate.is_candidate_verified &&
                ["super_admin"].includes(currentUserInfo.role) &&
                mode !== "edit" && (
                  <Hint label="Reset the Voucher issuance status">
                    <Button onClick={() => setShowResetIssuanceAlert(true)}>
                      Reset Voucher Issuance
                    </Button>
                  </Hint>
                )}

              {/* Right side — primary actions */}
              <div className="flex gap-2">
                {!isEditMode && (
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                )}

                {mode === "add" && (
                  <Button type="submit" form="candidate-form">
                    Add Beneficiary
                  </Button>
                )}

                {mode === "edit" && (
                  <Button
                    type="submit"
                    form="candidate-form"
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Saving.." : "Save Changes"}
                  </Button>
                )}

                {mode === "verify" && (
                  <Hint
                    label={
                      !isVerifiedChecked
                        ? "Check the Beneficiary details verified checkbox to proceed"
                        : candidate.is_candidate_verified
                        ? "Voucher for the beneficiary is already issued."
                        : "Issue Voucher to the beneficiary"
                    }
                  >
                    <div className="relative w-full flex justify-center">
                      <Button
                        type="submit"
                        className={`${
                          !isVerifiedChecked ? "cursor-not-allowed" : ""
                        }`}
                        disabled={
                          (!isVerifiedChecked ||
                            candidate.is_candidate_verified) &&
                          currentUserInfo.role !== "super_admin"
                        }
                        onClick={() => setShowVerifyConfirm(true)}
                      >
                        Issue Voucher
                      </Button>
                    </div>
                  </Hint>
                )}
              </div>
            </div>
          </DialogFooter>
        )}
        {showResetIssuanceAlert && (
          <AlertDialog
            open={showResetIssuanceAlert}
            onOpenChange={setShowResetIssuanceAlert}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Confirm voucher issuance reset of beneficiary
                </AlertDialogTitle>
              </AlertDialogHeader>
              <AlertDialogDescription asChild>
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-[120px_1fr] gap-3">
                    <span className="font-semibold">Full Name</span>
                    <span>{watch("full_name")}</span>

                    <span className="font-semibold">Mobile Number</span>
                    <span>{watch("mobile_number")}</span>

                    <span className="font-semibold">Employee ID</span>
                    <span>{watch("id")}</span>

                    <span className="font-semibold">Gift Card Code</span>
                    <span className="text-lg font-bold">
                      {candidate?.gift_card_code ?? "-"}
                    </span>

                    <span className="font-semibold">Aadhaar Number</span>
                    <span>{watch("aadhar_number")}</span>
                    <span className="font-semibold">Store</span>
                    <div className="flex flex-col">
                      {selectedStore ? (
                        <>
                          <span className="font-medium">
                            {selectedStore.name}
                          </span>

                          <span className="text-xs text-muted-foreground">
                            {[selectedStore.city.map((c) => c.name)].join(", ")}
                          </span>
                        </>
                      ) : (
                        <span className="text-red-500">No store selected</span>
                      )}
                    </div>
                  </div>
                </div>
              </AlertDialogDescription>
              <AlertDialogFooter>
                <p className="mt-3 text-amber-700 font-medium">
                  Are you sure everything is correct and you want to proceed?
                </p>
                <AlertDialogAction asChild>
                  <Button
                    onClick={resetIssuanceOfVoucher}
                    disabled={resettingVoucherIssuance}
                  >
                    {resettingVoucherIssuance ? (
                      <span>
                        <Loader2Icon className="animate-spin" />
                        Resetting
                      </span>
                    ) : (
                      "Ok"
                    )}
                  </Button>
                </AlertDialogAction>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CandidateFormDialog;
