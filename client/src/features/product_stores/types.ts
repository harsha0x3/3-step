import type { UserItem } from "../auth/types";

export interface NewStorePayload {
  name: string;
  city: string;
  address: string;

  email: string;
  mobile_number: string;
}

export interface StoreItem {
  id: string;
  name: string;
  city: string;
  address: string;

  email: string;
  mobile_number: string;
}

export interface StoreItemWithUser extends StoreItem {
  store_agents?: UserItem[];
  total_assigned_candidates?: number;
  total_laptops_issued?: number;
}

export interface StoreSearchParams {
  search_by: "name";
  search_term?: string;
}
