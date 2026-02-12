import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { compressImage } from "@/utils/imgCompressor";
import React, { useEffect, useState } from "react";
import EvidenceCaptures from "./EvidenceCaptures";
import { toast } from "sonner";
import {
  useGetLatestLaptopIssuerQuery,
  useGetUpgradeInfoQuery,
  useSubmitUpgradeRequestMutation,
} from "../store/verificationApiSlice";
import { useSelector } from "react-redux";
import { selectAuth } from "@/features/auth/store/authSlice";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { useGetCandidateByIdQuery } from "@/features/candidates/store/candidatesApiSlice";
import { IndianRupee } from "lucide-react";

interface UpgradeFormProps {
  candidateId: string;
  onSuccess?: () => void;
}

const UpgradeLaptopForm: React.FC<UpgradeFormProps> = ({
  candidateId,
  onSuccess,
}) => {
  const { data: upgradeInfo, isLoading: isFetchingUpgradeInfo } =
    useGetUpgradeInfoQuery({ candidateId }, { skip: !candidateId });

  const [laptopSerial, setLaptopSerial] = useState<string>("");
  const [storeEmployeeName, setStoreEmployeeName] = useState<string>("");
  const [storeEmployeeMobile, setStoreEmployeeMobile] = useState<string>("");
  const [upgradeProductInfo, setUpgradeProductInfo] = useState<string>("");
  const [costOfUpgrade, setCostOfUpgrade] = useState<number>();

  const [openConfirm, setOpenConfirm] = useState(false);
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

  useEffect(() => {
    if (upgradeInfo && !isFetchingUpgradeInfo) {
      setUpgradeProductInfo(upgradeInfo.data.upgrade_product_info);
      setCostOfUpgrade(upgradeInfo.data.cost_of_upgrade);
    }
  }, [upgradeInfo, isFetchingUpgradeInfo]);

  const currentUserInfo = useSelector(selectAuth);

  const { data: latestLaptopIssuer, isLoading: isLoadingLatestLaptopIssuer } =
    useGetLatestLaptopIssuerQuery(undefined, { skip: !candidateId });

  const [submitUpgradeRequest, { isLoading: isSubmittingUpgrade }] =
    useSubmitUpgradeRequestMutation();

  const { data: candidateDetails } = useGetCandidateByIdQuery(candidateId, {
    skip: !candidateId,
  });

  const formatIndianNumber = (value: number | string) => {
    if (value === "" || value === null || value === undefined) return "";
    return new Intl.NumberFormat("en-IN").format(Number(value));
  };

  useEffect(() => {
    if (!isLoadingLatestLaptopIssuer && latestLaptopIssuer) {
      setStoreEmployeeName(
        latestLaptopIssuer?.data?.store_employee_name ??
          currentUserInfo.full_name,
      );
      setStoreEmployeeMobile(
        latestLaptopIssuer?.data?.store_employee_mobile ??
          currentUserInfo.mobile_number,
      );
      setEmployeePhotoPreview(
        latestLaptopIssuer?.data?.store_employee_photo
          ? `${
              import.meta.env.VITE_API_BASE_API_URL
            }/hard_verify/api/v1.0/secured_file?path=${encodeURIComponent(
              latestLaptopIssuer?.data.store_employee_photo,
            )}`
          : null,
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

  const submitUpgrade = async () => {
    const formData = new FormData();
    formData.append("laptop_serial", laptopSerial);
    formData.append("store_employee_name", storeEmployeeName);
    formData.append("store_employee_mobile", storeEmployeeMobile);
    formData.append("upgrade_product_info", upgradeProductInfo);
    formData.append("cost_of_upgrade", String(costOfUpgrade));
    if (employeePhoto) formData.append("store_employee_photo", employeePhoto);
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
    try {
      await submitUpgradeRequest({
        candidateId: candidateId,
        payload: formData,
      }).unwrap();
      toast.success("Laptop issuance recorded successfully!");
      onSuccess?.();
    } catch (err) {
      const errMsg: string =
        err?.data?.detail?.msg ??
        err?.data?.detail ??
        "Error in upgrading laptop.  Try again";
      console.log("ERR IN LAP UPGRADE", err);
      toast.error(JSON.stringify(err));
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SERIAL NUMBER */}

        <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr]">
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

        <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr]">
          <Label className="font-medium">
            Details of Upgrade<span className="text-red-600"> *</span>
          </Label>
          <Textarea
            placeholder="Enter details of upgraded laptop"
            value={upgradeProductInfo}
            onChange={(e) => setUpgradeProductInfo(e.target.value)}
            className="w-80"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr]">
          <Label className="font-medium">
            Additional Cost (INR)<span className="text-red-600"> *</span>
          </Label>
          <div className="relative">
            <IndianRupee className="absolute w-4 h-4 text-muted-foreground left-2 top-1/2 -translate-y-1/2" />

            <Input
              placeholder="Payable amount in rupees"
              type="text"
              value={formatIndianNumber(costOfUpgrade)}
              onChange={(e) => {
                const rawValue = e.target.value.replace(/[^\d]/g, "");
                const numericValue = Number(rawValue);

                if (numericValue <= 999999) {
                  setCostOfUpgrade(numericValue);
                }
              }}
              className="w-74 pl-8"
              required
            />
          </div>
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
                      file = await compressImage(file, 1.0);

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
              {evidencePhotoPreview ? (
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
                      file = await compressImage(file, 1.0);

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
              {billPhotoPreview ? (
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
                      e: React.ChangeEvent<HTMLInputElement>,
                    ) => {
                      let file = e.target.files?.[0];
                      if (file) {
                        file = await compressImage(file, 1.0);

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
              {employeePhotoPreview ? (
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
          <Button
            type="submit"
            size="lg"
            className="w-36"
            disabled={isSubmittingUpgrade}
          >
            {isSubmittingUpgrade ? "Issuing..." : "Issue Laptop"}
          </Button>
        </div>
      </form>

      <AlertDialog open={openConfirm} onOpenChange={setOpenConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">
              Confirmation
            </AlertDialogTitle>
          </AlertDialogHeader>

          <AlertDialogDescription asChild>
            <div className="space-y-2 text-card-foreground! bg-card">
              <p>
                You are issuing a laptop with serial number{" "}
                <strong className="text-[14px]">"{laptopSerial}"</strong> to the
                following beneficiary:
              </p>
              <div className="grid grid-cols-[150px_1fr]">
                <strong>Name</strong>{" "}
                {candidateDetails?.data?.candidate.full_name}
              </div>
              <div className="grid grid-cols-[150px_1fr]">
                <strong>Gift Card Code</strong>{" "}
                <strong>
                  {candidateDetails?.data?.candidate.gift_card_code}
                </strong>
              </div>
              <div className="grid grid-cols-[150px_1fr]">
                <strong>Aadhaar Number</strong>{" "}
                {candidateDetails?.data?.candidate.aadhar_number}
              </div>
              <div className="flex flex-col items-center border px-1 py-2 rounded">
                Photo{" "}
                {candidateDetails?.data?.candidate &&
                candidateDetails?.data?.candidate?.photo ? (
                  <img
                    src={`${
                      import.meta.env.VITE_API_BASE_API_URL
                    }/hard_verify/api/v1.0/secured_file?path=${encodeURIComponent(
                      candidateDetails?.data?.candidate?.photo,
                    )}`}
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
            <AlertDialogAction
              disabled={isSubmittingUpgrade}
              onClick={submitUpgrade}
            >
              {isSubmittingUpgrade ? "Confirming..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UpgradeLaptopForm;
