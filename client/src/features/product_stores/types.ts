import type { UserItem } from "../auth/types";

export interface NewStorePayload {
  id: string;
  name: string;
  city_ids: string[];
  count: number;

  email?: string;
  mobile_number: string;

  address: string;
}

export interface City {
  id: string;
  name: string;
}

export interface StoreItem {
  id: string;
  name: string;
  city: City[];
  count: number;

  email?: string;
  mobile_number: string;

  address?: string;
}

export interface StoreItemWithUser extends StoreItem {
  store_agents?: UserItem[];
  total_assigned_candidates?: number;
  total_laptops_issued?: number;
}

export interface StoreSearchParams {
  search_by: "city" | "name";
  search_term?: string;
  page?: number; // default: 1
  page_size?: number; // default: 15
  sort_by?: string; // default: "created_at"
  sort_order?: string; // default: "desc"
}
