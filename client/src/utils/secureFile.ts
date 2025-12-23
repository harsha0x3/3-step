// src/utils/secureFile.ts
export const secureFileUrl = (path?: string | null) => {
  if (!path) return "";
  return `${
    import.meta.env.VITE_API_BASE_API_URL
  }/hard_verify/api/v1.0/secured_file?path=${encodeURIComponent(path)}`;
};
