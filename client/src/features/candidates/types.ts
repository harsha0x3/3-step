import type { UserItem } from "../auth/types";
import type { StoreItemWithUser } from "../product_stores/types";

export interface NewCandidatePayload {
  id?: string;
  full_name: string;
  mobile_number?: string;
  dob?: string;
  city?: string;
  state?: string;
  division?: string;
  aadhar_number?: string;

  store_id?: string;
  vendor_spoc_id?: string;
  is_candidate_verified?: boolean;
}
export interface UpdateCandidatePayload {
  id?: string;
  full_name?: string;
  mobile_number?: string;
  dob?: string;
  city?: string;
  state?: string;
  division?: string;
  aadhar_number?: string;

  store_id?: string;
  vendor_spoc_id?: string;
  is_candidate_verified?: boolean;
}

export interface CandidateItemWithStore extends NewCandidatePayload {
  coupon_code?: string | null | undefined;

  photo?: string;
  issued_status: string;

  aadhar_number?: string;
  aadhar_photo?: string;

  store_id?: string;
  is_candidate_verified: boolean;

  store?: StoreItemWithUser | null | undefined;
  verified_by?: UserItem | null | undefined;
}

export interface CandidatesSearchParams {
  search_by?: string | null;
  search_term?: string | null;
  page?: number; // default: 1
  page_size?: number; // default: 15
  sort_by?: string; // default: "created_at"
  sort_order?: string; // default: "desc"
  store_id?: string | null;
  is_verified?: boolean | undefined;
  is_issued?: boolean | undefined;
}
