import type { RegionOut } from "@/store/rootTypes";

export interface LoginPayload {
  email_or_mobile_number?: string;
  password: string;
  captcha_token?: string;
  mfa_code: string;
}

export interface RegisterPayload {
  mobile_number?: string;
  email?: string;
  password: string;
  full_name: string;
  role: "super_admin" | "admin" | "store_agent" | "registration_officer" | "";
  enable_mfa?: boolean;
}

export interface RegisterResponse {
  id: string;
  mobile_number?: string;
  email?: string;
  full_name: string;
  role: string;
}

export interface AuthState {
  id: string | null;
  mobile_number?: string | null;
  email?: string | null;
  full_name: string | null;
  role: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginResponse {
  id: string;
  mobile_number?: string;
  email?: string;
  full_name: string;
  role: string;
  is_first_login?: boolean;
  must_change_password?: boolean;
  mfa_enabled?: boolean;
}

export interface UserItem {
  id: string;
  mobile_number?: string;
  email?: string;
  full_name: string;
  role: string;
  location?: string;
  store_id: string;
  mfa_secret?: string;
  created_at: string;
  updated_at: string;
  must_change_password?: boolean;
  is_active?: boolean;

  regions: RegionOut[];
}

export type User = Partial<UserItem>;
