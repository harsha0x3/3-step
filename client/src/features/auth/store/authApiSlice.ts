import { rootApiSlice } from "@/store/rootApiSlice";
import type {
  LoginResponse,
  LoginPayload,
  RegisterResponse,
  RegisterPayload,
} from "../types";

import { loginSuccess, setError, setIsLoading, userLogout } from "./authSlice";

export const authApiSlice = rootApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginPayload>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: credentials,
      }),
      invalidatesTags: ["User"],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          dispatch(setIsLoading(true));
          const { data } = await queryFulfilled;
          dispatch(loginSuccess(data));
        } catch (err: any) {
          const errMsg: string =
            err?.data?.detail?.msg ??
            err?.data?.detail ??
            "Unexpected error in Logging in. Try again.";

          dispatch(setError(errMsg));
        } finally {
          dispatch(setIsLoading(false));
        }
      },
    }),

    register: builder.mutation<RegisterResponse, RegisterPayload>({
      query: (payload) => ({
        url: "/auth/register",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["AllUsers"],
    }),

    logout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["User"],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          dispatch(userLogout(data));
        } catch (err) {
          console.error("ERROR", err);

          const error = err as { data?: { detail?: string } };
          dispatch(setError(error?.data?.detail || "Error in logging out"));
          console.error("Error in logout slice", error);
        }
      },
    }),

    // getAllUsers: builder.query<RegisterResponse[], void>({
    //   query: () => "/auth/all",
    //   providesTags: ["AllUsers"],
    // }),

    getCurrentUser: builder.query<LoginResponse, void>({
      query: () => "/auth/me",
      providesTags: ["User"],
      onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          dispatch(loginSuccess(data));
        } catch (err) {
          dispatch(userLogout());
          // const errMsg: string =
          //   err?.data?.detail?.msg ??
          //   err?.data?.detail ??
          //   "Unexpected error in Auorization.";

          // dispatch(setError(errMsg + " Login again."));
        }
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  // useGetAllUsersQuery,
  useGetCurrentUserQuery,
} = authApiSlice;
