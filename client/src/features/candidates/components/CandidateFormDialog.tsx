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
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  useAddNewCandidateMutation,
  useUpdateCandidateMutation,
  useUploadCandidatePhotoMutation,
} from "../store/candidatesApiSlice";
import type {
  NewCandidatePayload,
  CandidateItemWithStore,
  UpdateCandidatePayload,
} from "../types";
import { Pencil } from "lucide-react";
import { useSelector } from "react-redux";
import { selectAuth } from "@/features/auth/store/authSlice";
import { useVerifyCandidateAadharMutation } from "@/features/verification/store/verificationApiSlice";
import StoresCombobox from "@/features/product_stores/components/StoresCombobox";
import VendorSpocCombobox from "@/features/vendors/components/VendorSpocCombobox";

type Props = {
  store_id?: string;
  candidate?: CandidateItemWithStore | null;
  viewOnly?: boolean;
  toVerify?: boolean;
};

const CandidateFormDialog: React.FC<Props> = ({
  store_id,
  candidate,
  viewOnly = false,
  toVerify = false,
}) => {
  const [open, setOpen] = React.useState(false);

  const [addNewCandidate, { isLoading: isAdding }] =
    useAddNewCandidateMutation();
  const [updateCandidate, { isLoading: isUpdating }] =
    useUpdateCandidateMutation();
  const [uploadPhoto, { isLoading: isUploadingPhoto }] =
    useUploadCandidatePhotoMutation();
  const [verifyCandidateAadhar, { isLoading: isVerifyingAadhar }] =
    useVerifyCandidateAadharMutation();

  const [candidatePhoto, setCandidatePhoto] = useState<File | null>(null);
  const [candidateData, setCandidateData] =
    useState<CandidateItemWithStore | null>(null);
  const [verifyAadhar, setVerifyAadhar] = useState<string>("");

  const currentUserInfo = useSelector(selectAuth);
  const isEditMode =
    !!candidate && currentUserInfo.role === "admin" && !toVerify;

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
          full_name: candidate.full_name,
          gender: candidate.gender,
          aadhar_number: "",
          mobile_number: candidate.mobile_number,
          email: candidate.email,
          address: candidate.address,
          vendor_id: candidate.vendor_id,
          is_candidate_verified: candidate.is_candidate_verified,

          store_id: candidate.store_id,
        }
      : { store_id: store_id || "" },
  });

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
        setCandidateData(res?.data?.candidate);
        toast.success("Candidate updated successfully!");
      } else {
        const res = await addNewCandidate(data).unwrap();
        setCandidateData(res?.data?.candidate);
        toast.success("Candidate added successfully!");
      }

      reset();
    } catch (err: any) {
      const errMsg: string =
        err?.data?.detail?.msg ?? err?.data?.detail ?? "Error verifying face";

      const errDesc = err?.data?.detail?.msg
        ? err?.data?.detail?.err_stack
        : "";
      toast.error(errMsg, { description: errDesc });
    }
  };

  const handleVerifyAadhar = async () => {
    try {
      await verifyCandidateAadhar({
        candidateId: candidateData?.id ?? candidate?.id,
      }).unwrap();
      toast.success("Aadhaar verified successfully");
    } catch (err) {
      const errMsg: string =
        err?.data?.detail?.msg ?? err?.data?.detail ?? "Error verifying face";

      const errDesc = err?.data?.detail?.msg
        ? err?.data?.detail?.err_stack
        : "";
      toast.error(errMsg, { description: errDesc });
    }
  };

  const handleImageUpload = async (
    photo: File,
    type: "candidate" | "parent"
  ) => {
    if (!photo) return;
    const formData = new FormData();
    formData.append("photo", photo);

    try {
      await uploadPhoto({
        candidateId: candidateData?.id ?? candidate?.id,
        formData,
      });
      toast.success(
        `${
          type === "candidate" ? "Candidate" : "Parent"
        } photo uploaded successfully`
      );
    } catch (err: any) {
      toast.error("Photo upload failed", {
        description: err?.data?.detail?.err_stack ?? "",
      });
    }
  };

  // ---------- JSX ----------
  const renderTextInput = (
    name: keyof NewCandidatePayload,
    label: string,
    type: string = "text",
    required = true
  ) => (
    <div className="grid gap-1">
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
        {isEditMode ? (
          <Button variant="ghost" size="sm">
            <Pencil className="w-4 h-4" />
          </Button>
        ) : (
          <Button>
            {isEditMode
              ? "Edit Candidate"
              : toVerify
              ? "Verify candidate"
              : "Add Candidate"}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[650px] h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            {viewOnly
              ? "View Candidate"
              : isEditMode
              ? "Edit Candidate"
              : "Add New Candidate"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-2">
          <section className="flex flex-col gap-4">
            <h3 className="font-semibold text-lg mb-2">Candidate Details</h3>
            {renderTextInput("full_name", "Full Name")}
            {renderTextInput("gender", "Gender")}
            {!isEditMode && renderTextInput("aadhar_number", "Aadhaar Number")}
            {renderTextInput("mobile_number", "Mobile Number")}
            {renderTextInput("email", "Email", "email")}
            {renderTextInput("address", "Address")}
            <StoresCombobox
              value={watch("store_id")}
              onChange={(store) =>
                setValue("store_id", store.id, { shouldDirty: true })
              }
              disabled={viewOnly}
            />

            <VendorSpocCombobox
              value={watch("vendor_id")}
              onChange={(vendor_spoc) =>
                setValue("vendor_id", vendor_spoc.id, { shouldDirty: true })
              }
            />
            <div className="flex items-center gap-2 mt-2">
              <Input
                type="checkbox"
                id="is_candidate_verified"
                {...register("is_candidate_verified")}
                disabled={viewOnly}
                className="w-4 h-4"
              />
              <Label htmlFor="is_candidate_verified">Candidate Verified</Label>
            </div>
          </section>

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
                    ? "Updating..."
                    : "Update Candidate"
                  : isAdding
                  ? "Adding..."
                  : "Add Candidate"}
              </Button>
            </DialogFooter>
          )}
        </form>

        <div className="border-t mt-4 pt-4 space-y-4">
          <h3 className="font-semibold text-lg">Photos</h3>

          {/* Candidate Photo */}
          <div className="flex items-center gap-3">
            {candidate?.photo || candidateData?.photo ? (
              <img
                src={`${
                  import.meta.env.VITE_API_BASE_API_URL
                }/hard_verify/api/v1.0/uploads/${
                  candidateData?.photo ?? candidate?.photo
                }`}
                alt="Candidate"
                className="w-20 h-20 object-cover rounded-md border"
              />
            ) : (
              <div className="w-20 h-20 border rounded-md flex items-center justify-center text-gray-400">
                No Photo
              </div>
            )}
            {!viewOnly && currentUserInfo.role === "admin" && (
              <div className="flex flex-col gap-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setCandidatePhoto(e.target.files?.[0] || null)
                  }
                />
                <Button
                  type="button"
                  disabled={isUploadingPhoto || !candidatePhoto}
                  onClick={() =>
                    handleImageUpload(candidatePhoto!, "candidate")
                  }
                >
                  {isUploadingPhoto ? "Uploading..." : "Upload Candidate Photo"}
                </Button>
              </div>
            )}
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
            {!viewOnly && currentUserInfo.role === "admin" && (
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
          {currentUserInfo.role === "verifier" && (
            <Dialog>
              <DialogTrigger asChild>
                <Button>Verify Candidate</Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Verify Aadhaar</DialogTitle>
                  <DialogDescription>
                    Verify candidate details by entering correct Aadhar Number
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-start">
                  <Label htmlFor="verifyAadhar">Aadhaar Number</Label>
                  <Input
                    id="verifyAadhar"
                    type="text"
                    value={verifyAadhar}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setVerifyAadhar(e.target.value)
                    }
                  />
                  <div className="flex items-end">
                    <Button
                      className="mt-2"
                      disabled={isVerifyingAadhar || verifyAadhar.trim() === ""}
                      onClick={handleVerifyAadhar}
                    >
                      {isVerifyingAadhar ? "Verifying..." : "Verify Aadhaar"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CandidateFormDialog;
