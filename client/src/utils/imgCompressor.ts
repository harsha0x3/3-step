import imageCompression from "browser-image-compression";

export const compressImage = async (file: File, maxSizeMB = 1.5) => {
  if (file.size / 1024 / 1024 <= maxSizeMB) return file; // already under size

  const options = {
    maxSizeMB, // target size
    useWebWorker: true,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error("Error compressing image:", error);
    return file; // fallback to original
  }
};
