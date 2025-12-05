// src/store/rootApiSlice.ts

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCSRFToken } from "@/utils/csrf";

const apiUrl = import.meta.env.VITE_RELATIVE_API_URL;

const baseQueryWithAuth = fetchBaseQuery({
  baseUrl: apiUrl,
  credentials: "include",
  prepareHeaders: (headers) => {
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      headers.set("X-CSRF-Token", csrfToken);
    } else {
      console.error(
        "::::::::********CSRF token not found***********:::::::::::"
      );
    }

    return headers;
  },
});

export const rootApiSlice = createApi({
  baseQuery: baseQueryWithAuth,
  tagTypes: [
    "User",
    "AllUsers",
    "Stores",
    "Candidates",
    "VerificationStatus",
    "Vendors",
    "VendorsSpoc",
    "Issuance",
    "Users",
    "Dashboard",
  ],

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  endpoints: (builder) => ({}),
});
