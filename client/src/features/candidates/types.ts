import type { RegionOut } from "@/store/rootTypes";
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
  region_id?: string;
  region?: RegionOut;
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
  region_id?: string;
}

export interface CandidateItemWithStore extends NewCandidatePayload {
  coupon_code?: string | null | undefined;

  photo?: string;
  issued_status: string;

  aadhar_number?: string;
  aadhar_photo?: string;

  store_id?: string;
  is_candidate_verified: boolean;

  gift_card_code?: string;

  store?: StoreItemWithUser | null | undefined;
  verified_by?: UserItem | null | undefined;

  voucher_issued_at?: string;
}

export interface PartialCandidateItem {
  id: string;
  full_name: string;
  mobile_number: string;
  issued_status?: string | null;
  is_candidate_verified: boolean;
  store?: StoreItemWithUser | null;
  is_requested_for_upgrade: boolean;
  photo: string;

  scheduled_at?: string;
  upgrade_product_info?: string;
  cost_of_upgrade?: number;
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
  upgrade_request?: boolean | undefined;
}
