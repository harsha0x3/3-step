// src/features/utilityFiles/pages/UtilityFilesPage.tsx
import React, { useState } from "react";
import {
  useGetAllUtilityFilesQuery,
  useUploadUtilityFileMutation,
  type UtilityFileType,
} from "./store/utilityFilesApiSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Loader, Loader2 } from "lucide-react";
import { secureFileUrl } from "@/utils/secureFile";
import { useSelector } from "react-redux";
import { selectAuth } from "../auth/store/authSlice";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const FILE_TYPES: { label: string; type: UtilityFileType }[] = [
  { label: "Voucher Distribution SOP", type: "voucher_distribution_sop" },
  { label: "Laptop Distribution SOP", type: "laptop_distribution_sop" },
  { label: "Login SOP", type: "login_sop" },
  { label: "Upgrade Laptop SOP", type: "upgrade_laptop_sop" },
];

const UtilityFilesPage: React.FC = () => {
  const currentUserInfo = useSelector(selectAuth);
  const { data, isLoading } = useGetAllUtilityFilesQuery();
  const [uploadFile, { isLoading: isUploading }] =
    useUploadUtilityFileMutation();

  const [selectedFiles, setSelectedFiles] = useState<
    Partial<Record<UtilityFileType, File>>
  >({});

  const handleFileChange = (type: UtilityFileType, file?: File | null) => {
    if (!file) return;
    setSelectedFiles((prev) => ({ ...prev, [type]: file }));
  };

  const handleUpload = async (type: UtilityFileType) => {
    try {
      const file = selectedFiles[type];
      if (!file) return;

      await uploadFile({ file, type }).unwrap();
      setSelectedFiles((prev) => ({ ...prev, [type]: undefined }));
      toast.success("File uploaded successfully");
    } catch (err) {
      const errMsg = err?.data?.detail ?? "Error uploading file";
      toast.error(errMsg);
    }
  };

  if (isLoading) {
    return <Loader className="animate-spin w-8 h-8" />;
  }

  const filesByType = new Map(data?.map((item) => [item.type, item]) ?? []);

  return (
    <div className="space-y-4">
      {FILE_TYPES.map(({ label, type }) => {
        const existingFile = filesByType.get(type);

        return (
          <Card key={type}>
            <CardContent className="space-y-3">
              <CardTitle className="text-sm">{label}</CardTitle>

              <div className="flex gap-2">
                {currentUserInfo.role === "super_admin" && (
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1 items-center">
                      <Label
                        htmlFor={type}
                        className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer"
                      >
                        Choose File
                      </Label>
                      <Input
                        id={type}
                        type="file"
                        accept="application/pdf"
                        onChange={(e) =>
                          handleFileChange(type, e.target.files?.[0])
                        }
                        className="hidden"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleUpload(type)}
                      disabled={!selectedFiles[type] || isUploading}
                    >
                      {isUploading ? (
                        <span>
                          <Loader2 className="animate-spin" />
                          Uploading...
                        </span>
                      ) : (
                        "Upload"
                      )}
                    </Button>
                  </div>
                )}

                {existingFile?.path && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      window.open(secureFileUrl(existingFile.path), "_blank")
                    }
                  >
                    View
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default UtilityFilesPage;
