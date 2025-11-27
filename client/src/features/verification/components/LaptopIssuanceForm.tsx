import React, { useMemo, useState } from "react";
import {
  useGetCandidateIssuanceDetailsQuery,
  useIssueLaptopMutation,
} from "../store/verificationApiSlice";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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

import EvidenceCaptures from "./EvidenceCaptures";
import type { IssuanceDetailsItem } from "../types";
// import SuccessDialog from "./SuccessDialog";

interface LaptopIssuanceFormProps {
  candidateId: string;
  onSuccess?: () => void;
}

const LaptopIssuanceForm: React.FC<LaptopIssuanceFormProps> = ({
  candidateId,
  onSuccess,
}) => {
  // const [openSuccess, setOpenSuccess] = useState<boolean>(false);
  const [laptopSerial, setLaptopSerial] = useState("");
  const [storeEmployeeName, setStoreEmployeeName] = useState("");
  const [storeEmployeeMobile, setStoreEmployeeMobile] = useState("");
  const [issueLaptop, { isLoading }] = useIssueLaptopMutation();
  const [evidencePhoto, setEvidencePhoto] = useState<File | null>(null);
  const [billPhoto, setBillPhoto] = useState<File | null>(null);
  const [employeePhoto, setEmployeePhoto] = useState<File | null>(null);
  const [evidencePhotoPreview, setEvidencePhotoPreview] = useState<
    string | null
  >(null);
  const [billPhotoPreview, setBillPhotoPreview] = useState<string | null>(null);
  const [employeePhotoPreview, setEmployeePhotoPreview] = useState<
    string | null
  >(null);
  const [openConfirm, setOpenConfirm] = useState(false);

  const { data: issuanceDetails, isLoading: isLoadingIssuanceDetails } =
    useGetCandidateIssuanceDetailsQuery(candidateId, { skip: !candidateId });

  const handleEvidencePhotoSubmit = async (formData: FormData) => {
    const file = formData.get("photo") as File;
    if (file) {
      setEvidencePhoto(file);
      if (file) setEvidencePhotoPreview(URL.createObjectURL(file));
      toast.success("Photo captured successfully!");
    }
  };
  const handleBillPhotoSubmit = async (formData: FormData) => {
    const file = formData.get("photo") as File;
    if (file) {
      setBillPhoto(file);
      if (file) setBillPhotoPreview(URL.createObjectURL(file));
      toast.success("Photo captured successfully!");
    }
  };
  const handleEmployeePhotoSubmit = async (formData: FormData) => {
    const file = formData.get("photo") as File;
    if (file) {
      setEmployeePhoto(file);
      if (file) setEmployeePhotoPreview(URL.createObjectURL(file));
      toast.success("Photo captured successfully!");
    }
  };

  const baseUrl = import.meta.env.VITE_API_BASE_API_URL;
  const issuanceDetailsData: IssuanceDetailsItem = useMemo(() => {
    if (!isLoadingIssuanceDetails && issuanceDetails) {
      return issuanceDetails.data;
    }
  }, [isLoadingIssuanceDetails, issuanceDetails]);

  const submitIssuance = async () => {
    const formData = new FormData();
    formData.append("laptop_serial", laptopSerial);
    formData.append("store_employee_name", storeEmployeeName);
    formData.append("store_employee_mobile", storeEmployeeMobile);
    if (employeePhoto) formData.append("store_employee_photo", employeePhoto);
    else {
      toast.error("Store employee Photo is not added");
      return;
    }
    if (evidencePhoto) formData.append("evidence_photo", evidencePhoto);
    else {
      toast.error("Laptop Photo with beneficiary is not added");
      return;
    }
    if (billPhoto) formData.append("bill_photo", billPhoto);
    else {
      toast.error("Laptop Photo with beneficiary is not added");
      return;
    }

    try {
      await issueLaptop({ candidateId, formData }).unwrap();
      toast.success("Laptop issuance recorded successfully!");
      setLaptopSerial("");
      onSuccess?.();
    } catch (err) {
      const errMsg: string =
        err?.data?.detail?.msg ??
        err?.data?.detail ??
        "Error Registring the Issuance of laptop.";

      const errDesc = err?.data?.detail?.msg
        ? err?.data?.detail?.err_stack
        : "";
      toast.error(errMsg, { description: errDesc });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidencePhoto) {
      toast.error("Beneficiary Photo with laptop is not added");
      return;
    }
    if (!billPhoto) {
      toast.error("Bill / Reciept Photo of laptop is not added");
      return;
    }
    if (!employeePhoto) {
      toast.error("Store employee Photo is not added");
      return;
    }

    setOpenConfirm(true);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SERIAL NUMBER */}
        <div className="grid grid-cols-[180px_1fr]">
          <Label className="font-medium">
            Laptop Serial Number<span className="text-red-600"> *</span>
          </Label>
          <Input
            placeholder="Enter laptop serial number"
            value={laptopSerial}
            onChange={(e) => setLaptopSerial(e.target.value)}
            className="w-74"
            required
          />
        </div>

        {/* EVIDENCE PHOTO */}
        <div className="border rounded-md p-4 space-y-3">
          <h3 className="font-semibold text-sm text-gray-600">
            Beneficiary with Laptop Photo
            <span className="text-red-600"> *</span>
          </h3>

          <div className="grid grid-cols-2 gap-4 items-center">
            <div className="space-y-2 flex flex-col justify-center w-32">
              <Label>Upload Photo</Label>
              <div>
                <Label
                  htmlFor="laptop-evidence"
                  className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer w-32"
                >
                  Choose File
                </Label>
                <Input
                  id="laptop-evidence"
                  type="file"
                  accept="image/*"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    console.log("INSIDE ON CHANGE");
                    const file = e.target.files?.[0];
                    if (file) {
                      console.log("FILE DOES EXIST");
                      setEvidencePhoto(file);
                      setEvidencePhotoPreview(URL.createObjectURL(file));
                    }
                  }}
                  className="hidden"
                />
              </div>

              <p className="text-center text-xs text-gray-400">OR</p>

              <EvidenceCaptures
                onSubmit={handleEvidencePhotoSubmit}
                dialogTitle="Capture PHoto of Beneficiary With Laptop"
              />
            </div>

            <div className="flex justify-center">
              {issuanceDetailsData?.evidence_photo ? (
                <img
                  src={`${baseUrl}/hard_verify/api/v1.0/uploads/${issuanceDetailsData.evidence_photo}`}
                  className="w-36 h-36 rounded-lg border object-cover"
                />
              ) : evidencePhotoPreview ? (
                <img
                  src={evidencePhotoPreview}
                  className="w-36 h-36 rounded-lg border object-cover"
                />
              ) : (
                <div className="w-36 h-36 flex items-center justify-center border rounded-lg text-sm text-gray-400">
                  "No Photo"
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RECEIPT PHOTO */}
        <div className="border rounded-md p-4 space-y-3">
          <h3 className="font-semibold text-sm text-gray-600">
            Bill / Receipt Photo<span className="text-red-600"> *</span>
          </h3>

          <div className="grid grid-cols-2 gap-4 items-center">
            <div className="space-y-2 flex flex-col justify-center w-32">
              <Label>Upload Photo</Label>
              <div>
                <Label
                  htmlFor="bill-reciept"
                  className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer w-32"
                >
                  Choose File
                </Label>
                <Input
                  id="bill-reciept"
                  type="file"
                  accept="image/*"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setBillPhoto(file);
                      setBillPhotoPreview(URL.createObjectURL(file));
                    }
                  }}
                  className="hidden"
                />
              </div>

              <p className="text-center text-xs text-gray-400">OR</p>

              <EvidenceCaptures
                onSubmit={handleBillPhotoSubmit}
                dialogTitle="Capture Photo Reciept / Bill of the laptop"
              />
            </div>

            <div className="flex justify-center">
              {issuanceDetailsData?.bill_reciept ? (
                <img
                  src={`${baseUrl}/hard_verify/api/v1.0/uploads/${issuanceDetailsData.bill_reciept}`}
                  className="w-36 h-36 rounded-lg border object-cover"
                />
              ) : billPhotoPreview ? (
                <img
                  src={billPhotoPreview}
                  className="w-36 h-36 rounded-lg border object-cover"
                />
              ) : (
                <div className="w-36 h-36 flex items-center justify-center border rounded-lg text-sm text-gray-400">
                  "No Photo"
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Store Employee Details */}
        <div className="border rounded-md p-4 space-y-3">
          <h3 className="font-semibold text-sm text-gray-600">
            Store Empoyee Details<span className="text-red-600"> *</span>
          </h3>

          <div className="grid grid-cols-[180px_1fr]">
            <Label>
              Employee Name<span className="text-red-600"> *</span>
            </Label>
            <Input
              value={storeEmployeeName}
              onChange={(e) => setStoreEmployeeName(e.target.value)}
              className="w-74"
              required
              placeholder="Enter your full name"
            />
          </div>
          <div className="grid grid-cols-[180px_1fr]">
            <Label className="font-medium">
              Employee Mobile Number<span className="text-red-600"> *</span>
            </Label>
            <Input
              placeholder="Enter your mobile number"
              value={storeEmployeeMobile}
              onChange={(e) => setStoreEmployeeMobile(e.target.value)}
              className="w-74"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4 items-center">
            <div className="space-y-2">
              <Label>
                Upload Employee Photo<span className="text-red-600"> *</span>
              </Label>
              <div className="space-y-2 flex flex-col justify-center w-32">
                <div>
                  <Label
                    htmlFor="store-employee"
                    className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer w-32"
                  >
                    Choose File
                  </Label>
                  <Input
                    id="store-employee"
                    type="file"
                    accept="image/*"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setEmployeePhoto(file);
                        setEmployeePhotoPreview(URL.createObjectURL(file));
                      }
                    }}
                    className="hidden"
                  />
                </div>

                <p className="text-center text-xs text-gray-400">OR</p>

                <EvidenceCaptures
                  onSubmit={handleEmployeePhotoSubmit}
                  dialogTitle="Capture Photo of employee (who is issuing the laptop)"
                />
              </div>
            </div>

            <div className="flex justify-center">
              {issuanceDetailsData?.bill_reciept ? (
                <img
                  src={`${baseUrl}/hard_verify/api/v1.0/uploads/${issuanceDetailsData.store_employee_photo}`}
                  className="w-36 h-36 rounded-lg border object-cover"
                />
              ) : employeePhotoPreview ? (
                <img
                  src={employeePhotoPreview}
                  className="w-36 h-36 rounded-lg border object-cover"
                />
              ) : (
                <div className="w-36 h-36 flex items-center justify-center border rounded-lg text-sm text-gray-400">
                  "No Photo"
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SUBMIT */}
        <div className="pt-4 flex justify-center">
          <Button type="submit" size="lg" className="w-36" disabled={isLoading}>
            {isLoading ? "Issuing..." : "Issue Laptop"}
          </Button>
          {/* <Button type="button" onClick={() => setOpenSuccess(true)}>
            show success
          </Button> */}
        </div>
      </form>
      {/* <SuccessDialog open={openSuccess} setOpen={setOpenSuccess} /> */}

      <AlertDialog open={openConfirm} onOpenChange={setOpenConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">
              Confirmation
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Verify the details.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <div className="grid grid-cols-[150px_1fr]">
              <strong>Laptop Serial</strong> {laptopSerial}
            </div>
            <div className="grid grid-cols-[150px_1fr]">
              <strong>Employee Name</strong> {storeEmployeeName}
            </div>
            <div className="grid grid-cols-[150px_1fr]">
              <strong>Employee Mobile</strong> {storeEmployeeMobile}
            </div>

            <div className="pt-2 space-y-1 grid grid-cols-2 gap-2">
              <div className="flex flex-col items-center border px-1 py-2 rounded">
                Beneficiary Photo with laptop{" "}
                {evidencePhoto && evidencePhotoPreview ? (
                  <img
                    src={evidencePhotoPreview}
                    className="w-36 h-36 rounded-lg border object-cover"
                  />
                ) : (
                  <div className="w-36 h-36 flex items-center justify-center border rounded-lg text-sm text-gray-400">
                    "Not Added"
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center border px-1 py-2 rounded">
                Receipt Photo{" "}
                {billPhoto && billPhotoPreview ? (
                  <img
                    src={billPhotoPreview}
                    className="w-36 h-36 rounded-lg border object-cover"
                  />
                ) : (
                  <div className="w-36 h-36 flex items-center justify-center border rounded-lg text-sm text-gray-400">
                    "Not Added"
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center border px-1 py-2 rounded">
                Store Employee Photo{" "}
                {employeePhoto && employeePhotoPreview ? (
                  <img
                    src={employeePhotoPreview}
                    className="w-36 h-36 rounded-lg border object-cover"
                  />
                ) : (
                  <div className="w-36 h-36 flex items-center justify-center border rounded-lg text-sm text-gray-400">
                    "Not Added"
                  </div>
                )}
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isLoading} onClick={submitIssuance}>
              {isLoading ? "Submitting..." : "Submit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LaptopIssuanceForm;
