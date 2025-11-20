export interface LoginPayload {
  email_or_username?: string;
  password: string;
  mfa_code: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role: "super_admin" | "admin" | "store_agent" | "registration_officer" | "";
  enable_mfa?: boolean;
}

export interface RegisterResponse {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
}

export interface AuthState {
  id: string | null;
  username: string | null;
  email: string | null;
  full_name: string | null;
  role: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginResponse {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
}

export interface UserItem {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  mfa_secret?: string;
  created_at: string;
  updated_at: string;
}
