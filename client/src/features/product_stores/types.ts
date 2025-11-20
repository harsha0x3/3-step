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
}

export interface StoreSearchParams {
  search_by: "name";
  search_term?: string;
}
