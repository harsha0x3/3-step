import type { UserItem } from "../auth/types";

export interface NewStorePayload {
  store_person_first_name?: string;
  store_person_last_name?: string;
  store_name: string;
  contact_number: string;
  email: string;
  address: string;
}

export interface StoreItem {
  id: string;
  store_name: string;
  contact_person_id: string;
  contact_number: string;
  email: string;
  address: string;
  city: string;
  state: string;
  maps_link?: string;
  created_at: string;
  updated_at: string;
}

export interface StoreItemWithUser {
  id: string;
  store_name: string;
  contact_number: string;
  email: string;
  address: string;

  store_person: UserItem;
}
