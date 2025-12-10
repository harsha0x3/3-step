import React, { useEffect, useMemo, useState } from "react";
import {
  useGetCandidateIssuanceDetailsQuery,
  useGetLatestLaptopIssuerQuery,
  useIssueLaptopMutation,
  useRequestUpgradeMutation,
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
import { useGetCandidateByIdQuery } from "@/features/candidates/store/candidatesApiSlice";
import { useSelector } from "react-redux";
import { selectAuth } from "@/features/auth/store/authSlice";
import { compressImage } from "@/utils/imgCompressor";
import type { UpgradeRequestPayload } from "../types";
import { Textarea } from "@/components/ui/textarea";
import { AlertDescription } from "@/components/ui/alert";
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
  const [upgradeFormData, setUpgradeFormData] = useState<UpgradeRequestPayload>(
    {
      upgrade_product_type: "",
      upgrade_product_info: "",
      upgrade_reason: "",
      payment_difference: 0,
    }
  );
  const [toUpgrade, setToUpgrade] = useState<boolean>(false);
  const [showUpgradeCancel, setShowUpgradeCancel] = useState<boolean>(false);
  const handleUpgradeFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setUpgradeFormData((prev) => ({ ...prev, [name]: value }));
  };

  const [laptopSerial, setLaptopSerial] = useState("");
  const [storeEmployeeName, setStoreEmployeeName] = useState("");
  const [storeEmployeeMobile, setStoreEmployeeMobile] = useState("");
  const [issueLaptop, { isLoading }] = useIssueLaptopMutation();
  const [evidencePhoto, setEvidencePhoto] = useState<File | null>(null);
  const [billPhoto, setBillPhoto] = useState<File | null>(null);
  const [employeePhoto, setEmployeePhoto] = useState<File | null>(null);
  const [employeePhotoUrl, setEmployeePhotoUrl] = useState<string>("");
  const [evidencePhotoPreview, setEvidencePhotoPreview] = useState<
    string | null
  >(null);
  const [billPhotoPreview, setBillPhotoPreview] = useState<string | null>(null);
  const [employeePhotoPreview, setEmployeePhotoPreview] = useState<
    string | null
  >(null);
  const [openConfirm, setOpenConfirm] = useState(false);

  const currentUserInfo = useSelector(selectAuth);

  const {
    data: issuanceDetails,
    isLoading: isLoadingIssuanceDetails,
    isError: isIssuanceDetailsFetchError,
  } = useGetCandidateIssuanceDetailsQuery(candidateId, { skip: !candidateId });

  const { data: latestLaptopIssuer, isLoading: isLoadingLatestLaptopIssuer } =
    useGetLatestLaptopIssuerQuery(undefined, { skip: !candidateId });

  const { data: candidateDetails } = useGetCandidateByIdQuery(candidateId, {
    skip: !candidateId,
  });

  const [requestForUpgrade] = useRequestUpgradeMutation();

  useEffect(() => {
    if (!isLoadingLatestLaptopIssuer && latestLaptopIssuer) {
      setStoreEmployeeName(
        latestLaptopIssuer?.data?.store_employee_name ??
          currentUserInfo.full_name
      );
      setStoreEmployeeMobile(
        latestLaptopIssuer?.data?.store_employee_mobile ??
          currentUserInfo.mobile_number
      );
      setEmployeePhotoUrl(latestLaptopIssuer?.data?.store_employee_photo ?? "");
      setEmployeePhotoPreview(
        latestLaptopIssuer?.data?.store_employee_photo
          ? `${import.meta.env.VITE_API_BASE_API_URL}/hard_verify/api/v1.0/${
              latestLaptopIssuer?.data.store_employee_photo
            }`
          : null
      );
    }
  }, [isLoadingLatestLaptopIssuer, latestLaptopIssuer]);

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
  const issuanceDetailsData = useMemo(() => {
    if (isIssuanceDetailsFetchError) return null;
    return issuanceDetails?.data ?? null;
  }, [issuanceDetails, isIssuanceDetailsFetchError]);

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
      toast.error("Beneficiary Photo with Laptop is not added");
      return;
    }
    if (billPhoto) formData.append("bill_photo", billPhoto);
    else {
      toast.error("Beneficiary Photo with Laptop is not added");
      return;
    }

    if (toUpgrade) {
      try {
        const upgradeRes = await requestForUpgrade({
          candidateId: candidateId,
          payload: upgradeFormData,
        });
        console.log("Upgrade Res");
      } catch (err) {
        const errMsg: string =
          err?.data?.detail?.msg ??
          err?.data?.detail ??
          "Error Registring the Issuance of laptop.";

        const errDesc = err?.data?.detail?.msg
          ? err?.data?.detail?.err_stack
          : "";
        toast.error(errMsg);
        return;
      }
    }

    try {
      await issueLaptop({ candidateId, formData }).unwrap();
      toast.success("Laptop issuance recorded successfully!");
      setLaptopSerial("");
      onSuccess?.();
    } catch (err) {
      console.log("ERR in issuance rec", err);
      const errMsg: string =
        err?.data?.detail?.msg ??
        err?.data?.detail ??
        "Error Registring the Issuance of laptop.";

      const errDesc = err?.data?.detail?.msg
        ? err?.data?.detail?.err_stack
        : "";
      toast.error(errMsg);
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
    if (!employeePhoto && !latestLaptopIssuer?.data.store_employee_photo) {
      toast.error("Store employee Photo is not added");
      return;
    }

    setOpenConfirm(true);
  };

  return (
    <div>
      <div className="flex justify-center pb-5 pt-0">
        <Button
          className="text-center"
          onClick={() => {
            if (!toUpgrade) setToUpgrade(true);
            else {
              setShowUpgradeCancel(true);
            }
          }}
          variant={toUpgrade ? "destructive" : "default"}
        >
          {toUpgrade ? "Cancel Upgrade" : "Upgrade Product"}
        </Button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SERIAL NUMBER */}
        {toUpgrade && (
          <div className="border rounded px-4 py-6 space-y-6 relative">
            <p className="absolute translate-x-55 -translate-y-10 text-lg font-bold bg-card rounded-md px-1">
              Product Upgrade Form
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr]">
              <Label className="font-medium">
                Product Type<span className="text-red-600"> *</span>
              </Label>
              <Input
                name="upgrade_product_type"
                placeholder="Enter the type of upgrading product"
                value={upgradeFormData.upgrade_product_type}
                onChange={handleUpgradeFormChange}
                className="w-74"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr]">
              <Label className="font-medium">
                Product Info (Specs)<span className="text-red-600"> *</span>
              </Label>
              <Textarea
                name="upgrade_product_info"
                placeholder="Enter the description or specs of upgrading product"
                value={upgradeFormData.upgrade_product_info}
                onChange={handleUpgradeFormChange}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr]">
              <Label className="font-medium">
                Reason for Upgrade<span className="text-red-600"> *</span>
              </Label>
              <Textarea
                name="upgrade_reason"
                placeholder="Enter the reason for upgrading product"
                value={upgradeFormData.upgrade_reason}
                onChange={handleUpgradeFormChange}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr]">
              <Label className="font-medium">
                Price Difference between new and old products
                <span className="text-red-600"> *</span>
              </Label>
              <Input
                name="payment_difference"
                type="number"
                placeholder="Enter the difference of the price between old and upgrading product"
                value={upgradeFormData.payment_difference}
                onChange={handleUpgradeFormChange}
              />
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr]">
          <Label className="font-medium">
            {toUpgrade ? upgradeFormData.upgrade_product_type : "Laptop"} Serial
            Number<span className="text-red-600"> *</span>
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
            Beneficiary Photo with Laptop
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
                  onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                    console.log("INSIDE ON CHANGE");
                    let file = e.target.files?.[0];
                    if (file) {
                      console.log("FILE DOES EXIST");
                      file = await compressImage(file, 1.5);

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
                  src={`${baseUrl}/hard_verify/api/v1.0/${issuanceDetailsData.evidence_photo}`}
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
            Photo of Bill / Receipt<span className="text-red-600"> *</span>
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
                  onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                    let file = e.target.files?.[0];
                    if (file) {
                      file = await compressImage(file, 1.5);

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
                  src={`${baseUrl}/hard_verify/api/v1.0/${issuanceDetailsData.bill_reciept}`}
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
            Store Empoyee Details (enter details only if this is the first
            issuance or any changes required.)
            <span className="text-red-600"> *</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr]">
            <Label>
              Issued By<span className="text-red-600"> *</span>
            </Label>
            <Input
              value={storeEmployeeName}
              onChange={(e) => setStoreEmployeeName(e.target.value)}
              className="w-74"
              required
              placeholder="Enter your full name"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr]">
            <Label className="font-medium">
              Mobile Number<span className="text-red-600"> *</span>
            </Label>
            <Input
              placeholder="Enter your mobile number"
              value={storeEmployeeMobile}
              type="tel"
              onChange={(e) => setStoreEmployeeMobile(e.target.value)}
              className="w-74"
              minLength={10}
              maxLength={10}
              pattern="[0-9]{10}"
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
                    onChange={async (
                      e: React.ChangeEvent<HTMLInputElement>
                    ) => {
                      let file = e.target.files?.[0];
                      if (file) {
                        file = await compressImage(file, 1.5);

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
                  src={`${baseUrl}/hard_verify/api/v1.0/${issuanceDetailsData.store_employee_photo}`}
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

      <AlertDialog open={showUpgradeCancel} onOpenChange={setShowUpgradeCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure to cancel upgrade?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDescription></AlertDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                onClick={() => {
                  setToUpgrade(false);
                  setUpgradeFormData({
                    upgrade_product_type: "",
                    upgrade_product_info: "",
                    upgrade_reason: "",
                    payment_difference: 0,
                  });
                }}
              >
                Yes
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={openConfirm} onOpenChange={setOpenConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">
              Confirmation
            </AlertDialogTitle>
          </AlertDialogHeader>

          <AlertDialogDescription asChild>
            <div className="space-y-2 text-card-foreground! bg-card">
              {toUpgrade && (
                <>
                  <p>You have upgraded the product to the following</p>
                  <div className="grid grid-cols-[150px_1fr]">
                    <strong>Product Type</strong>{" "}
                    {upgradeFormData.upgrade_product_type}
                  </div>
                  <div className="grid grid-cols-[150px_1fr]">
                    <strong>Product Description</strong>{" "}
                    {upgradeFormData.upgrade_product_info}
                  </div>
                  <div className="grid grid-cols-[150px_1fr]">
                    <strong>Reason</strong> {upgradeFormData.upgrade_reason}
                  </div>
                  <div className="grid grid-cols-[150px_1fr]">
                    <strong>Price Difference</strong>{" "}
                    {upgradeFormData.payment_difference}
                  </div>
                </>
              )}
              <p>
                You are issuing a{" "}
                {toUpgrade ? upgradeFormData.upgrade_product_type : "laptop"}{" "}
                with serial number{" "}
                <strong className="text-[14px]">"{laptopSerial}"</strong> to the
                following beneficiary:
              </p>
              <div className="grid grid-cols-[150px_1fr]">
                <strong>Name</strong>{" "}
                {candidateDetails?.data?.candidate.full_name}
              </div>
              <div className="grid grid-cols-[150px_1fr]">
                <strong>Voucher Code</strong>{" "}
                <strong>{candidateDetails?.data?.candidate.coupon_code}</strong>
              </div>
              <div className="grid grid-cols-[150px_1fr]">
                <strong>Aadhar Number</strong>{" "}
                {candidateDetails?.data?.candidate.aadhar_number}
              </div>
              <div className="flex flex-col items-center border px-1 py-2 rounded">
                Photo{" "}
                {candidateDetails?.data?.candidate &&
                candidateDetails?.data?.candidate?.photo ? (
                  <img
                    src={`${
                      import.meta.env.VITE_API_BASE_API_URL
                    }/hard_verify/api/v1.0/${
                      candidateDetails?.data?.candidate?.photo
                    }`}
                    className="w-36 h-36 rounded-lg border object-cover"
                  />
                ) : (
                  <div className="w-36 h-36 flex items-center justify-center border rounded-lg text-sm text-gray-400">
                    "Not Added"
                  </div>
                )}
              </div>
            </div>
          </AlertDialogDescription>

          {/* <div className="space-y-2">
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
          </div> */}

          <AlertDialogFooter>
            <p className=" text-amber-700 font-medium">
              Are you sure everything is correct and you want to proceed?
            </p>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isLoading} onClick={submitIssuance}>
              {isLoading ? "Confirming..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LaptopIssuanceForm;
