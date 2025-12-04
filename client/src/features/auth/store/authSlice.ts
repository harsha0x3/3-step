//src/features/auth/store/authSlice
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthState, LoginResponse } from "../types";
import type { RootState } from "@/store/rootStore";
const initialState: AuthState = {
  id: null,
  mobile_number: null,
  email: null,
  full_name: null,
  role: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (
      state,
      action: PayloadAction<LoginResponse | Partial<AuthState>>
    ) => {
      const payload = action.payload;
      const user = payload as LoginResponse;

      state.mobile_number = user.mobile_number ?? state.mobile_number;
      state.id = user.id ?? state.id;
      state.role = user.role ?? state.role;
      state.full_name = user.full_name ?? state.full_name;
      state.email = user.email ?? state.email;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    registerSuccess: (state, action) => {
      const { mobile_number, role, full_name, email, id } = action.payload;

      state.mobile_number = mobile_number ?? state.mobile_number;
      state.role = role ?? state.role;
      state.id = id ?? state.id;
      state.full_name = full_name ?? state.full_name;
      state.email = email ?? state.email;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },

    updateUser: (state, action: PayloadAction<Partial<AuthState>>) => {
      const { mobile_number, role, full_name, email } = action.payload;
      state.mobile_number = mobile_number ?? state.mobile_number;
      state.role = role ?? state.role;
      state.full_name = full_name ?? state.full_name;
      state.email = email ?? state.email;
    },

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    userLogout: (state) => initialState,

    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  loginSuccess,
  registerSuccess,
  userLogout,
  setIsLoading,
  setError,
} = authSlice.actions;

export const selectAuth = (state: RootState) => state.auth;
export const selectError = (state: RootState) => state.auth.error;
export const selectIsLoading = (state: RootState) => state.auth.isLoading;
export const selectIsAuthenticated = (state: RootState) =>
  state.auth.isAuthenticated;
export const selectUserRole = (state: RootState) => state.auth.role;
export default authSlice.reducer;
