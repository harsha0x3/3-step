//src/features/auth/store/authSlice
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthState, LoginResponse } from "../types";
import type { RootState } from "@/store/rootStore";
const initialState: AuthState = {
  id: null,
  username: null,
  email: null,
  first_name: null,
  last_name: null,
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

      state.username = user.username ?? state.username;
      state.id = user.id ?? state.id;
      state.role = user.role ?? state.role;
      state.last_name = user.last_name ?? state.last_name;
      state.first_name = user.first_name ?? state.first_name;
      state.email = user.email ?? state.email;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    registerSuccess: (state, action) => {
      const { username, role, first_name, last_name, email, id } =
        action.payload;

      state.username = username ?? state.username;
      state.role = role ?? state.role;
      state.id = id ?? state.id;
      state.last_name = last_name ?? state.last_name;
      state.first_name = first_name ?? state.first_name;
      state.email = email ?? state.email;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },

    updateUser: (state, action: PayloadAction<Partial<AuthState>>) => {
      const { username, role, first_name, last_name, email } = action.payload;
      state.username = username ?? state.username;
      state.role = role ?? state.role;
      state.last_name = last_name ?? state.last_name;
      state.first_name = first_name ?? state.first_name;
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
