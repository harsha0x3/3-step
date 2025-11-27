import { rootApiSlice } from "@/store/rootApiSlice";

export const usersApiSlice = rootApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllUsers: builder.query({
      query: () => "/users",
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
