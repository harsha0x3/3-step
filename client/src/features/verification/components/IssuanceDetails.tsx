import React, { useMemo } from "react";
import type { CandidateItemWithStore } from "@/features/candidates/types";
import { CardContent, CardTitle } from "@/components/ui/card";
import {
  User,
  Phone,
  Store,
  MapPin,
  Ticket,
  Hash,
  ImageIcon,
  ReceiptText,
  Loader,
  CheckCircleIcon,
  XCircleIcon,
  TicketCheck,
  MapPinCheck,
  UserIcon,
  Laptop,
  GiftIcon,
} from "lucide-react";
import type {
  IssuanceDetailsItem,
  IssuedStatusWithUpgrade,
  UpgradeRequestItem,
} from "../types";
import { useGetCandidateIssuanceDetailsQuery } from "../store/verificationApiSlice";
import { useGetCandidateVerificationStatusQuery } from "../store/verificationApiSlice";
import clsx from "clsx";
import { ScrollArea } from "@/components/ui/scroll-area";
import Hint from "@/components/ui/hint";
import { Textarea } from "@/components/ui/textarea";

interface IssuanceDetailProps {
  candidate: CandidateItemWithStore;
  issuanceDetails?: IssuedStatusWithUpgrade;
  isToConfirm?: boolean;
}

const IssuanceDetails: React.FC<IssuanceDetailProps> = ({
  candidate,
  issuanceDetails,
  isToConfirm = false,
}) => {
  const baseUrl = import.meta.env.VITE_API_BASE_API_URL;

  const {
    data: issuanceDetailsData,
    isLoading: isLoadingIssuanceDetails,
    isError,
    error: issueDetailsFetchError,
  } = useGetCandidateIssuanceDetailsQuery(candidate.id, {
    skip: !candidate || !!issuanceDetails,
  });
  const { data: verificationStatus, isLoading: isFetchingVerificationStatus } =
    useGetCandidateVerificationStatusQuery(candidate.id, {
      skip: !candidate,
      refetchOnMountOrArgChange: true,
    });

  const candidateIssuanceDetails: IssuanceDetailsItem = useMemo(() => {
    if (issuanceDetails) {
      return issuanceDetails.issuance_details;
    } else if (!isLoadingIssuanceDetails && issuanceDetailsData) {
      return issuanceDetailsData.data.issuance_details;
    }
  }, [issuanceDetailsData, issuanceDetails, isLoadingIssuanceDetails]);

  const candidateUpgradeDetails: UpgradeRequestItem = useMemo(() => {
    if (issuanceDetails && issuanceDetails?.is_upgrade_request) {
      return issuanceDetails.upgrade_request_details;
    } else if (
      !isLoadingIssuanceDetails &&
      issuanceDetailsData &&
      issuanceDetailsData?.data?.is_upgrade_request
    ) {
      return issuanceDetailsData.data.upgrade_request_details;
    }
  }, [issuanceDetails, issuanceDetailsData, isLoadingIssuanceDetails]);

  const StatusItem = ({
    label,
    status,
  }: {
    label: string;
    status: boolean;
  }) => (
    <div
      className={`flex items-center gap-2 text-muted-foreground px-2 rounded text-[7px] ${
        status ? "border border-green-200" : "border border-red-200"
      }`}
    >
      <span>{label}</span>

      <Hint label={status ? "Verified" : "Failed"}>
        <span
          className={clsx(
            "flex items-center gap-1 font-medium",
            status ? "text-green-500" : "text-red-500"
          )}
        >
          {status ? (
            <CheckCircleIcon className="w-5 h-5" />
          ) : (
            <XCircleIcon className="w-5 h-5" />
          )}
        </span>
      </Hint>
    </div>
  );

  const PhotoCard = ({
    title,
    icon: Icon,
    image,
    fallback,
  }: {
    title: string;
    icon: React.ElementType;
    image: string | null;
    fallback: string;
  }) => (
    <div className="border rounded-md shadow-md py-3">
      <div className="flex flex-row items-center gap-2 justify-center pb-2">
        <Icon className="w-5 h-5 text-primary" />
        <CardTitle className="text-sm">{title}</CardTitle>
      </div>
      <CardContent className="flex justify-center">
        {image ? (
          <img
            src={`${baseUrl}/hard_verify/api/v1.0/${image}?t=${Date.now()}`}
            className="w-64 h-64 rounded-md object-cover border"
          />
        ) : (
          <div className="w-64 h-64 flex flex-col items-center justify-center border rounded text-muted-foreground">
            <ImageIcon className="w-8 h-8 mb-2" />
            {fallback}
          </div>
        )}
      </CardContent>
    </div>
  );

  return (
    <>
      {isLoadingIssuanceDetails ? (
        <Loader className="animate-spin w-10 h-10" />
      ) : isError && issueDetailsFetchError ? (
        <p>Error fetching issuance details {JSON.stringify(candidate)}</p>
      ) : candidateIssuanceDetails ? (
        <div className="space-y-6">
          <ScrollArea className="overflow-auto">
            <div className="grid sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4" />
                <span>
                  <strong>ID:</strong> {candidate.id}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>
                  <strong>Name:</strong> {candidate.full_name}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>
                  <strong>Phone:</strong> {candidate.mobile_number}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4" />
                <span>
                  <strong>Voucher:</strong>{" "}
                  <span className="text-[15px] font-semibold text-black">
                    {candidate.coupon_code}
                  </span>
                </span>
              </div>

              {!isToConfirm && (
                <div className="flex items-center gap-2">
                  <TicketCheck className="w-4 h-4" />
                  <span>
                    <strong>Voucher Issued By:</strong>{" "}
                    {candidate.verified_by?.full_name}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Store className="w-4 h-4" />
                <span>
                  <strong>Store:</strong> {candidate.store?.name}
                </span>
              </div>
              {!isToConfirm && (
                <div className="flex items-center gap-2">
                  <MapPinCheck className="w-4 h-4" />
                  <span>
                    <strong>Voucher Issued at:</strong>{" "}
                    {candidate.verified_by?.location}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>
                  <strong>Store Location:</strong> {candidate.store?.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4" />
                <span>
                  <strong>Laptop Serial:</strong>{" "}
                  <span className="text-[15px] font-semibold text-black">
                    {candidateIssuanceDetails?.issued_laptop_serial ?? ""}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <GiftIcon className="w-4 h-4" />
                <span>
                  <strong>Gift Card Code:</strong>{" "}
                  <span className="text-[15px] font-semibold text-black">
                    {candidate?.gift_card_code ?? ""}
                  </span>
                </span>
              </div>
            </div>

            {!isToConfirm &&
              !isFetchingVerificationStatus &&
              verificationStatus && (
                <div className="pb-2">
                  <div className="flex items-center w-full gap-3 py-2">
                    <strong className="text-muted-foreground">
                      Verification Status:
                    </strong>
                    <div className="flex justify-between items-center text-sm py-1">
                      <StatusItem
                        label="Voucher Code"
                        status={verificationStatus.data.is_coupon_verified}
                      />
                      <span className="px-2">|</span>
                      <StatusItem
                        label="Aadhar Number"
                        status={verificationStatus.data.is_aadhar_verified}
                      />
                      <span className="px-2">|</span>

                      <StatusItem
                        label="Facial Recognition"
                        status={verificationStatus.data.is_facial_verified}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="grid sm:grid-cols-2 gap-4 items-start text-sm text-muted-foreground">
                      {verificationStatus.data?.overriding_user && (
                        <div className="flex items-center gap-2">
                          <span>
                            <strong>Verification Overridden By:</strong>{" "}
                            {verificationStatus.data?.overriding_user}
                          </span>
                        </div>
                      )}
                      {verificationStatus.data?.overriding_reason && (
                        <div className="flex flex-col items-start gap-1">
                          <strong>Reason For Verification Overriding:</strong>{" "}
                          <Textarea
                            value={verificationStatus.data?.overriding_reason}
                            readOnly
                            className="border rounded-md w-64 overflow-auto"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            {candidateUpgradeDetails && (
              <div className="px-4 py-3 border rounded relative mt-2">
                <p className="font-semibold text-[13px] w-fit text-center abosolute -translate-y-6 bg-card rounded px-1">
                  Product Upgrade Details
                </p>
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  {/* <p>
                    <strong>Product Type</strong>{" "}
                    {candidateUpgradeDetails.upgrade_product_type}
                  </p> */}
                  <p>
                    <strong>Price Difference</strong>{" "}
                    {candidateUpgradeDetails.cost_of_upgrade}
                  </p>
                  <div className="grid grid-cols-1">
                    <strong>Upgrades details</strong>{" "}
                    {candidateUpgradeDetails.upgrade_product_info}
                  </div>
                  {/* <div className="grid grid-cols-1">
                    <strong>Reason</strong>{" "}
                    {candidateUpgradeDetails.upgrade_reason}
                  </div> */}
                  <div className="grid grid-cols-[150px_1fr]"></div>
                </div>
              </div>
            )}

            {/* PHOTOS */}
            {!isToConfirm && (
              <div className="grid sm:grid-cols-2 gap-5 pt-7">
                <PhotoCard
                  title="Beneficiary with Laptop"
                  icon={ImageIcon}
                  image={candidateIssuanceDetails.evidence_photo}
                  fallback="No Evidence Photo"
                />

                <PhotoCard
                  title="Bill / Receipt"
                  icon={ReceiptText}
                  image={candidateIssuanceDetails.bill_reciept}
                  fallback="No Receipt Uploaded"
                />
                <PhotoCard
                  title="Laptop Issued By"
                  icon={UserIcon}
                  image={candidateIssuanceDetails.store_employee_photo}
                  fallback="No Receipt Uploaded"
                />
              </div>
            )}
            {isToConfirm && (
              <div className="grid sm:grid-cols-2 gap-5 pt-7">
                <PhotoCard
                  title="Beneficiary Photo"
                  icon={UserIcon}
                  image={candidate.photo}
                  fallback="Beneficary Photo"
                />
              </div>
            )}
          </ScrollArea>
        </div>
      ) : (
        <div></div>
      )}
    </>
  );
};

export default IssuanceDetails;
