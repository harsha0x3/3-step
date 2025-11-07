export interface LoginPayload {
  email_or_username?: string;
  password: string;
  mfa_code: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name?: string;
  role: "user" | "admin" | "store_personnel";
  enable_mfa?: boolean;
}

export interface RegisterResponse {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name?: string;
  role: string;
}

export interface AuthState {
  id: string | null;
  username: string | null;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginResponse {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

export interface UserItem {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  mfa_secret?: string;
  created_at: string;
  updated_at: string;
}
