import type { StoreItemWithUser } from "../product_stores/types";

export interface NewCandidatePayload {
  full_name: string;
  gender: string;
  aadhar_number: string;
  mobile_number?: string;
  email?: string;
  address: string;
  store_id?: string;
  vendor_id?: string;
  is_candidate_verified?: boolean;
}

export type UpdateCandidatePayload = Partial<NewCandidatePayload>;

export interface CandidatesSearchParams {
  search_by?: "id" | "full_name" | "aadhar_last_four_digits" | null;
  search_term?: string | null;
}

export interface CandidateItemWithStore {
  id: string;
  coupon_code?: string | null | undefined;
  full_name: string;
  gender: string;
  aadhar_number: string;
  mobile_number?: string;
  email?: string;
  address: string;
  photo?: string;
  issued_status: string;

  store_id?: string;
  vendor_id?: string;

  store_with_user?: StoreItemWithUser | null | undefined;
  is_candidate_verified: boolean;
}
