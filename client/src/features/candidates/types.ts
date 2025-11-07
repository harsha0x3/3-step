import type { StoreItemWithUser } from "../product_stores/types";

export interface NewCandidatePayload {
  full_name: string;
  gender: string;
  dob: string;
  aadhar_number: string;
  mobile_number: string;
  email: string;
  disability_type: string;
  address: string;
  city: string;
  state: string;
  store_id: string;
  parent_name: string;
  parent_employee_code: string;
  parent_mobile_number: string;
  parent_email: string;
  parent_photo_url: string;
  parent_relation: string;
}

export type UpdateCandidatePayload = Partial<NewCandidatePayload>;

export interface CandidatesSearchParams {
  search_by?: "id" | "full_name" | "aadhar_last_four_digits" | null;
  search_term?: string | null;
}

export interface CandidateItemWithStore {
  id: string;
  full_name: string;
  gender: string;
  dob: string;
  aadhar_last_four_digits: string;
  mobile_number: string;
  email: string;
  disability_type: string;
  address: string;
  city: string;
  state: string;
  photo_url?: string | null;
  store_id: string;
  issued_status: string;

  parent_name: string;
  parent_employee_code: string;
  parent_mobile_number: string;
  parent_email: string;
  parent_photo_url: string;
  parent_relation: string;
  store_with_user?: StoreItemWithUser | null | undefined;
  is_candidate_verified: boolean;

  coupon?: string | null | undefined;
}
