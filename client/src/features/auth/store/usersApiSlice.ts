import { rootApiSlice } from "@/store/rootApiSlice";
import type { ApiResponse } from "@/store/rootTypes";
import type { UserItem } from "../types";

export const usersApiSlice = rootApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllUsers: builder.query<
      ApiResponse<{
        users: UserItem[];
        count: number;
        total_store_agents: number;
        total_registration_officers: number;
        total_super_admins: number;
        total_admins: number;
      }>,
      {
        page?: number;
        page_size?: number;
        search?: string;
        sort_by?: string;
        sort_order?: "asc" | "desc";
        search_by?: string;
      } | void
    >({
      query: (params) => {
        const {
          page = 1,
          page_size = 20,
          search = "",
          sort_by = "created_at",
          sort_order = "desc",
          search_by = "full_name",
        } = params || {};

        const urlParams = new URLSearchParams();
        urlParams.append("page", page.toString());
        urlParams.append("page_size", page_size.toString());

        if (search) urlParams.append("search_term", search);
        if (sort_by) urlParams.append("sort_by", sort_by);
        if (sort_order) urlParams.append("sort_order", sort_order);
        if (search_by) urlParams.append("search_by", search_by);

        return `/users?${urlParams.toString()}`;
      },
      providesTags: ["Users"],
    }),

    createUser: builder.mutation({
      query: (payload) => ({
        url: "/users",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Users"],
    }),

    updateUser: builder.mutation({
      query: ({ userId, payload }) => ({
        url: `/users/${userId}`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: ["Users"],
    }),

    deleteUser: builder.mutation({
      query: (userId) => ({
        url: `/users/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Users"],
    }),

    resetUserPassword: builder.mutation({
      query: (userId) => ({
        url: `/users/${userId}/reset-password`,
        method: "POST",
      }),
      invalidatesTags: ["Users"],
    }),

    requestPasswordReset: builder.mutation({
      query: (payload) => ({
        url: "/users/password-reset/request",
        method: "POST",
        body: payload,
      }),
    }),

    verifyPasswordReset: builder.mutation({
      query: (payload) => ({
        url: "/users/password-reset/verify",
        method: "POST",
        body: payload,
      }),
    }),

    changePassword: builder.mutation({
      query: (payload) => ({
        url: "/users/password/change",
        method: "POST",
        body: payload,
      }),
    }),
  }),
});

export const {
  useGetAllUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useResetUserPasswordMutation,
  useRequestPasswordResetMutation,
  useVerifyPasswordResetMutation,
  useChangePasswordMutation,
} = usersApiSlice;
