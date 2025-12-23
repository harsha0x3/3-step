import { rootApiSlice } from "@/store/rootApiSlice";

export type UtilityFileType =
  | "voucher_distribution_sop"
  | "laptop_distribution_sop"
  | "login_sop"
  | "upgrade_laptop_sop";

export interface UtilityFileResponse {
  type: UtilityFileType;
  path: string;
  created_at?: string;
  updated_at?: string;
  id: string;
}

export const utilityFilesApiSlice = rootApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    uploadUtilityFile: builder.mutation<
      { msg: string },
      { file: File; type: UtilityFileType }
    >({
      query: ({ file, type }) => {
        const formData = new FormData();
        formData.append("file", file);

        return {
          url: `/utility_files/${type}`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["UtilityFiles"],
    }),

    getAllUtilityFiles: builder.query<UtilityFileResponse[], void>({
      query: () => `/utility_files/all`,
      providesTags: ["UtilityFiles"],
    }),
    getUtilityFile: builder.mutation<Blob, UtilityFileType>({
      query: (fileType) => ({
        url: `/utility_files/${fileType}`,
        method: "GET",
        responseHandler: async (response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch file");
          }
          return response.blob();
        },
      }),
    }),
  }),
});

export const {
  useUploadUtilityFileMutation,
  useGetAllUtilityFilesQuery,
  useGetUtilityFileMutation,
} = utilityFilesApiSlice;
