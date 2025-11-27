// src/store/rootApiSlice.ts

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const apiUrl = import.meta.env.VITE_RELATIVE_API_URL;

const baseQueryWithAuth = fetchBaseQuery({
  baseUrl: apiUrl,
  credentials: "include",
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
