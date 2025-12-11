import type { UserItem } from "../auth/types";

export interface VerificationResult {
  verification_status: {
    is_coupon_verified: boolean;
    is_aadhar_verified: boolean;
    is_facial_verified: boolean;
    is_all_verified: boolean;
  };
  candidate: {
    candidate_id: string;
    photo: string;
    full_name: string;
    mobile_number: string;
  };
  failed_verifications: string[];
  requires_consent: boolean;
  is_already_issued: boolean;
}

export interface ConsolidateVerificationRequest {
  coupon_code: string;
  aadhar_number: string;
}

export interface OverrideRequest {
  overriding_reason: string;
}

export interface OverrideResult {
  can_proceed_to_otp: boolean;
}

export interface IssuanceDetailsItem {
  candidate_id: string;
  issued_status: string;
  issued_at: string;
  issued_laptop_serial: string;
  store_employee_name?: string;
  store_employee_mobile?: string;
  store_employee_photo?: string;
  bill_reciept?: string;
  evidence_photo?: string;
  issued_user?: UserItem;
}

export interface UpgradeRequestItem {
  candidate_id: string;
  upgrade_reason: string;
  upgrade_product_type: string;
  cost_of_upgrade: number;
  upgrade_product_info: string;
}

export interface IssuedStatusWithUpgrade {
  issuance_details: IssuanceDetailsItem;
  is_upgrade_request: boolean;
  upgrade_request_details?: UpgradeRequestItem | null;
}

export interface UpgradeRequestPayload {
  cost_of_upgrade: number;
  upgrade_product_info: string;
  new_laptop_serial?: string;
  existing_laptop_serial: string;

  upgrade_reason?: string;
  upgrade_product_type?: string;
}

export interface LatestIssuer {
  store_employee_name?: string | null;
  store_employee_mobile?: string | null;
  store_employee_photo?: string | null;
}

export interface VerificationStatusItem {
  candidate_id: string;
  is_coupon_verified: boolean;
  is_otp_verified: boolean;
  is_facial_verified: boolean;
  is_aadhar_verified: boolean;
  coupon_verified_at?: string;
  otp_verified_at?: string;
  facial_verified_at?: string;
  aadhar_verified_at?: string;
  uploaded_candidate_photo?: string;
  entered_aadhar_number?: string;
  created_at: string;
  updated_at: string;
  overriding_user?: string;
  overriding_reason?: string;
}

export interface RequestForUploadPayload {
  coupon_code: string;
  existing_laptop_serial: string;
}
