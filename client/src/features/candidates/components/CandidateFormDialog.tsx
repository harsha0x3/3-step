import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  useAddCandidateAadharMutation,
  useAddNewCandidateMutation,
  useUpdateCandidateMutation,
  useUploadCandidatePhotoMutation,
} from "../store/candidatesApiSlice";
import type {
  NewCandidatePayload,
  CandidateItemWithStore,
  UpdateCandidatePayload,
} from "../types";
import { CircleQuestionMarkIcon, Pencil } from "lucide-react";
import { useSelector } from "react-redux";
import { selectAuth } from "@/features/auth/store/authSlice";
import StoresCombobox from "@/features/product_stores/components/StoresCombobox";
import VendorSpocCombobox from "@/features/vendors/components/VendorSpocCombobox";
import CandidatePhotoCapture from "./CandidatePhotoCapture";
import VendorSpocFormDialog from "@/features/vendors/components/VendorSpocFormDialog";
import AadharPhotoCapture from "./AadharPhotoCapture";
import Hint from "@/components/ui/hint";

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
  const [candPhoto, setCandPhoto] = useState<File | null>();
  const [aadharPhoto, setAadharPhoto] = useState<File | null>();

  const [addNewCandidate, { isLoading: isAdding }] =
    useAddNewCandidateMutation();
  const [updateCandidate, { isLoading: isUpdating }] =
    useUpdateCandidateMutation();
  const [uploadPhoto, { isLoading: isUploadingPhoto }] =
    useUploadCandidatePhotoMutation();
  const [addAadharPhoto] = useAddCandidateAadharMutation();

  useState<CandidateItemWithStore | null>(null);

  const currentUserInfo = useSelector(selectAuth);
  const isEditMode =
    !!candidate &&
    (currentUserInfo.role === "admin" ||
      currentUserInfo.role === "super_admin" ||
      currentUserInfo.role === "registration_officer");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<NewCandidatePayload>({
    defaultValues: candidate
      ? {
          id: candidate.id,
          full_name: candidate.full_name,
          mobile_number: candidate.mobile_number,
          dob: candidate.dob,
          city: candidate.city,
          state: candidate.state,
          division: candidate.division,

          store_id: candidate.store_id,
          vendor_spoc_id: candidate.vendor_spoc_id,
          is_candidate_verified: candidate.is_candidate_verified,
        }
      : { store_id: store_id || "" },
  });

  useEffect(() => setOpen(defOpen), [defOpen]);

  // ---------- FORM SUBMIT HANDLERS ----------
  const onSubmit = async (data: NewCandidatePayload) => {
    if (viewOnly) return;
    try {
      if (isEditMode && candidate) {
        const dirty = Object.keys(dirtyFields);
        const payload: UpdateCandidatePayload = {};
        for (const key of dirty) {
          // @ts-ignore
          payload[key] = data[key];
        }

        if (Object.keys(payload).length === 0) {
          toast.info("No changes detected.");
          return;
        }

        const res = await updateCandidate({
          candidateId: candidate.id,
          payload,
        }).unwrap();
        toast.success("Candidate updated successfully!");
      } else {
        const res = await addNewCandidate(data).unwrap();
        toast.success("Candidate added successfully!");
      }

      reset();
    } catch (err: any) {
      const errMsg: string =
        err?.data?.detail?.msg ?? err?.data?.detail ?? "Error adding candidate";

      const errDesc = err?.data?.detail?.msg
        ? err?.data?.detail?.err_stack
        : "";
      toast.error(errMsg, { description: errDesc });
    }
  };
  useEffect(() => {
    if (candidate) {
      reset({
        id: candidate.id,
        full_name: candidate.full_name,
        mobile_number: candidate.mobile_number,
        dob: candidate.dob,
        city: candidate.city,
        state: candidate.state,
        division: candidate.division,

        store_id: candidate.store_id,
        vendor_spoc_id: candidate.vendor_spoc_id,
        is_candidate_verified: candidate.is_candidate_verified,
      });
    }
  }, [candidate, reset]);

  const handleImageUpload = async (
    photo: File,
    type: "aadhar" | "candidate"
  ) => {
    if (!photo) return;
    const formData = new FormData();
    formData.append("photo", photo);

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
        toast.success(`Aadhar photo uploaded successfully`);
      }
    } catch (err: any) {
      const errMsg: string =
        err?.data?.detail?.msg ?? err?.data?.detail ?? "Error uploading photo";

      const errDesc = err?.data?.detail?.msg
        ? err?.data?.detail?.err_stack
        : "";
      toast.error(errMsg, { description: errDesc });
    }
  };

  // ---------- JSX ----------
  const renderTextInput = (
    name: keyof NewCandidatePayload,
    label: string,
    type: string = "text",
    required = true,
    isReadOnly = false
  ) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Label className="font-semibold text-md flex gap-2" htmlFor={name}>
        {required && <span className="text-red-600">*</span>}
        {label}
      </Label>
      <Input
        id={name}
        type={type}
        readOnly={viewOnly || isReadOnly}
        {...register(
          name,
          required ? { required: `${label} is required` } : {}
        )}
      />
      {errors[name] && (
        <span className="text-sm text-amber-700">
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
        {isEditMode && !toVerify ? (
          <Button variant="ghost" size="sm">
            <Pencil className="w-4 h-4" />
          </Button>
        ) : isEditMode && toVerify ? (
          <Button>Verify Candidate</Button>
        ) : (
          <Button>{viewOnly ? "View Candidate" : "Add Candidate"}</Button>
        )}
      </DialogTrigger>

      <DialogContent
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
        className="w-[95vw] max-w-[650px] sm:max-w-[650px] 
                          h-[90vh] sm:h-[98vh] overflow-auto 
                          mx-auto"
      >
        <DialogHeader>
          <DialogTitle>
            {viewOnly
              ? "View Beneficiary Employee Details"
              : toVerify
              ? "Verify Beneficiary Employee Details"
              : isEditMode
              ? "Edit Beneficiary Employee Details"
              : "Add New Beneficiary Employee"}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription asChild>
          <div>
            {viewOnly ? (
              "View Beneficiary"
            ) : toVerify ? (
              <ol className="text-muted-foreground list-decimal list-inside">
                <li>
                  This is to verify details of benificiary employee and make any
                  necessary changes in fields like <b>Name</b> or{" "}
                  <b>Mobile No.</b>
                </li>
                <li>
                  Add the Beneficiary photo with the recieved voucher and a
                  photo copy of his / her aadhar.
                </li>
                <li>
                  Please make sure to take the benificiary photo is in passport
                  size with clear background and ligting as it will be used
                  later for facial recognition system.
                </li>
              </ol>
            ) : isEditMode ? (
              "Edit Beneficiary"
            ) : (
              "Add New Beneficiary"
            )}
          </div>
        </DialogDescription>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-2">
          <section className="flex flex-col gap-4">
            <h3 className="font-semibold text-lg mb-2">Candidate Details</h3>
            {renderTextInput("id", "Employee ID", "text", true, !!candidate)}
            {renderTextInput("full_name", "Full Name")}
            {renderTextInput("mobile_number", "Mobile Number")}
            {renderTextInput("dob", "Date of Birth")}
            {renderTextInput("city", "City")}
            {renderTextInput("state", "State")}
            {renderTextInput("division", "Division", "text", true, true)}
          </section>

          <section className="flex flex-col gap-4">
            <StoresCombobox
              value={watch("store_id")}
              onChange={(store) =>
                setValue("store_id", store.id, { shouldDirty: true })
              }
              isDisabled={
                currentUserInfo.role !== "admin" &&
                currentUserInfo.role !== "super_admin"
              }
            />
            <div className="flex gap-3 items-center">
              <VendorSpocCombobox
                value={watch("vendor_spoc_id")}
                onChange={(vendor_spoc) =>
                  setValue("vendor_spoc_id", vendor_spoc.id, {
                    shouldDirty: true,
                  })
                }
              />
              <div className="pt-5">
                <VendorSpocFormDialog />
              </div>
            </div>
            <p className="flex items-center gap-3 text-amber-700">
              Add a new Vendor spoc if it doesn’t exist in the list
            </p>
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Label className="font-semibold text-md">Voucher Code</Label>
            <Input
              type="text"
              readOnly
              value={candidate?.coupon_code ?? "Error getting"}
            />
          </div>

          {!!candidate && (
            <div className="border-t mt-4 pt-4 space-y-4 flex flex-col gap-3 ">
              <h3 className="font-semibold text-lg">Photos</h3>

              {/* Candidate Photo */}
              <div className="border relative p-2">
                <p className="absolute -translate-y-5 bg-background rounded px-2">
                  Beneficiary Employee Photo with voucher
                </p>
                <p className="flex gap-3 items-center text-amber-700">
                  <span>
                    <CircleQuestionMarkIcon className="w-3 h-3 text-blue-600" />
                  </span>
                  Capture the photo of beneficiary with the recieved voucher or
                  upload a captured one.
                </p>

                <div className="flex items-center gap-3">
                  {candidate?.photo ? (
                    <img
                      src={`${
                        import.meta.env.VITE_API_BASE_API_URL
                      }/hard_verify/api/v1.0/uploads/${candidate?.photo}`}
                      alt="Candidate"
                      className="w-25 h-25 object-cover rounded-md border"
                    />
                  ) : (
                    <div className="w-25 h-25 border rounded-md flex items-center justify-center text-gray-400">
                      No Photo
                    </div>
                  )}
                  {!viewOnly &&
                    (currentUserInfo.role === "admin" ||
                      currentUserInfo.role === "super_admin" ||
                      currentUserInfo.role === "registration_officer") && (
                      <div className="flex gap-3 items-center">
                        <CandidatePhotoCapture candidateId={candidate?.id} />
                        <p>(OR)</p>
                        <div className="flex flex-col gap-1">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              setCandPhoto(e.target.files?.[0] || null)
                            }
                          />
                          <Button
                            type="button"
                            disabled={isUploadingPhoto || !candPhoto}
                            onClick={() =>
                              handleImageUpload(candPhoto!, "candidate")
                            }
                          >
                            {isUploadingPhoto ? "Uploading..." : "Upload Photo"}
                          </Button>
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* Aadhar photo */}
              <div className="relative border p-2">
                <p className="absolute -translate-y-5 bg-background rounded px-2">
                  Beneficiary Employee's Aadhar card photo.
                </p>
                <p className="flex gap-3 items-center text-amber-700">
                  <Hint
                    label={
                      "Take a photo of beneficiary employee's aadhar for future proof with number clearly visible."
                    }
                  >
                    <span>
                      <CircleQuestionMarkIcon className="w-3 h-3 text-blue-600" />
                    </span>
                  </Hint>
                  Capture the photo of beneficiary employee's aadhar card or
                  upload a captured one.
                </p>
                <div className="flex items-center gap-3">
                  {candidate?.aadhar_photo ? (
                    <img
                      src={`${
                        import.meta.env.VITE_API_BASE_API_URL
                      }/hard_verify/api/v1.0/uploads/${
                        candidate?.aadhar_photo
                      }`}
                      alt="Candidate"
                      className="w-25 h-25 object-cover rounded-md border"
                    />
                  ) : (
                    <div className="w-25 h-25 border rounded-md flex items-center justify-center text-gray-400">
                      No Aadhar
                    </div>
                  )}
                  {!viewOnly &&
                    (currentUserInfo.role === "admin" ||
                      currentUserInfo.role === "super_admin" ||
                      currentUserInfo.role === "registration_officer") && (
                      <div className="flex gap-3 items-center">
                        <AadharPhotoCapture candidateId={candidate?.id} />
                        <p>(OR)</p>
                        <div className="flex flex-col gap-1">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              setAadharPhoto(e.target.files?.[0] || null)
                            }
                          />
                          <Button
                            type="button"
                            disabled={isUploadingPhoto || !aadharPhoto}
                            onClick={() =>
                              handleImageUpload(aadharPhoto!, "aadhar")
                            }
                          >
                            {isUploadingPhoto
                              ? "Uploading..."
                              : "Upload Aadhar"}
                          </Button>
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* Parent Photo */}
              {/* <div className="flex items-center gap-3">
            {candidate?.parent_photo_url || candidateData?.parent_photo_url ? (
              <img
                src={`${
                  import.meta.env.VITE_API_BASE_API_URL
                }/hard_verify/api/v1.0/uploads/${
                  candidateData?.parent_photo_url ?? candidate?.parent_photo_url
                }`}
                alt="Parent"
                className="w-20 h-20 object-cover rounded-md border"
              />
            ) : (
              <div className="w-20 h-20 border rounded-md flex items-center justify-center text-gray-400">
                No Photo
              </div>
            )}
            {!viewOnly && currentUserInfo.role === "admin" || currentUserInfo.role === "super_admin" && (
              <div className="flex flex-col gap-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setParentPhoto(e.target.files?.[0] || null)}
                />
                <Button
                  type="button"
                  disabled={isUploadingPhoto || !parentPhoto}
                  onClick={() => handleImageUpload(parentPhoto!, "parent")}
                >
                  {isUploadingPhoto ? "Uploading..." : "Upload Parent Photo"}
                </Button>
              </div>
            )}
          </div> */}
            </div>
          )}

          {isEditMode && (
            <div className="flex items-center gap-3 mt-2">
              <Input
                type="checkbox"
                id="is_candidate_verified"
                {...register("is_candidate_verified")}
                disabled={viewOnly}
                className="w-7 h-7"
              />
              <Label
                className="font-semibold text-md"
                htmlFor="is_candidate_verified"
              >
                Candidate Verified
              </Label>
              <p className="flex gap-3">
                <CircleQuestionMarkIcon className="w-3 h-3 text-blue-600" />
                Check the box if all the details of employee is verified.
              </p>
            </div>
          )}

          {/* <section>
            <h3 className="font-semibold text-lg mb-2">Parent Details</h3>
            {renderTextInput("parent_name", "Parent Name")}
            {renderTextInput("parent_employee_code", "Parent Employee Code")}
            {renderTextInput("parent_relation", "Relation")}
            {renderTextInput("parent_mobile_number", "Parent Mobile Number")}
            {renderTextInput("parent_email", "Parent Email", "email")}
          </section> */}

          {!viewOnly && (
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isAdding || isUpdating}>
                {isEditMode
                  ? isUpdating
                    ? `${toVerify ? "Verifying..." : "Updating..."}`
                    : `${toVerify ? "Verify" : "Update Candidate"}`
                  : isAdding
                  ? "Adding..."
                  : "Add Candidate"}
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CandidateFormDialog;
