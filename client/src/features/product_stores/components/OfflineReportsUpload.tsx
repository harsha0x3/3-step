import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { useUploadOfflineReportMutation } from "../store/productStoresApiSlice";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  CheckCircle,
  Download,
  FileSpreadsheet,
  Info,
  Upload,
  XCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const OfflineReportsUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  const [uploadOfflineReport, { isLoading: isUploading }] =
    useUploadOfflineReportMutation();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile) => {
    const validTypes = [".csv", ".xlsx", ".xls"];
    const fileExt = selectedFile.name
      .substring(selectedFile.name.lastIndexOf("."))
      .toLowerCase();

    if (!validTypes.includes(fileExt)) {
      alert("Please upload a CSV or Excel file");
      return;
    }

    setFile(selectedFile);
    setUploadResult(null);
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const downloadTemplate = async () => {
    // In production, this would call the API endpoint
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_API_URL
        }/hard_verify/api/v1.0/stores/download/upload-template`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to download template");
      }

      // Convert to blob
      const blob = await response.blob();

      // Extract filename from headers
      const disposition = response.headers.get("Content-Disposition");
      let filename = "offline_reports_upload_template.csv";

      if (disposition && disposition.includes("filename=")) {
        filename = disposition.split("filename=")[1].replace(/"/g, "");
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error.message);
      toast.error(error.message ?? "Failed to download template.");
    }
  };

  const handleUploadReport = async () => {
    if (!file) {
      toast.warning("No file uploaded.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await uploadOfflineReport(formData).unwrap();
      setUploadResult(res);
    } catch (err) {
      const errMsg: string =
        err?.data?.detail?.msg ??
        err?.data?.detail ??
        "Unexpected error in Uploading file. Try again.";
      toast.error(errMsg);
    }
  };
  const successRate = useMemo(() => {
    return uploadResult
      ? Math.round((uploadResult?.successful / uploadResult?.total_rows) * 100)
      : 0;
  }, [uploadResult]);
  return (
    <div className="space-y-4">
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Info className="w-5 h-5" />
            How to Use
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-blue-800">
          <div className="flex items-start gap-2">
            <span className="font-semibold min-w-6">1.</span>
            <span>
              Download the template file containing verified beneficiaries
              pending laptop issuance
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-semibold min-w-6">2.</span>
            <span>
              Fill in the <strong>Laptop Serial</strong>,{" "}
              <strong>Store Employee Name</strong>, and{" "}
              <strong>Store Employee Mobile</strong> columns for each issuance
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-semibold min-w-6">3.</span>
            <span>
              Do not modify other columns (Beneficiary Employee No, Full Name,
              Mobile Number, Voucher Code)
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-semibold min-w-6">4.</span>
            <span>
              Upload the completed file - the system will validate and process
              each record
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Offline Records</CardTitle>
          <CardDescription>
            Upload a CSV or Excel file with offline laptop issuance data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="w-full sm:w-auto"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Template with Pending Beneficiaries
          </Button>

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? "border-blue-500 bg-blue-50"
                : "border-slate-300 hover:border-slate-400"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-400 mb-4" />

            {file ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-900">
                  {file.name}
                </p>
                <p className="text-xs text-slate-500">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
                <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                  Remove
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-600 mb-2">
                  Drag and drop your file here, or click to browse
                </p>
                <p className="text-xs text-slate-500 mb-4">
                  Supports CSV, XLSX, XLS (Max 10MB)
                </p>
                <label>
                  <input
                    type="file"
                    className="hidden"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileInput}
                  />
                  <Button variant="secondary" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Select File
                    </span>
                  </Button>
                </label>
              </>
            )}
          </div>

          {file && (
            <Button
              onClick={handleUploadReport}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? "Processing..." : "Upload and Process"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Upload Results */}
      {uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Upload Results
              <Badge
                variant={uploadResult?.failed === 0 ? "default" : "secondary"}
              >
                {uploadResult?.failed === 0 ? "Complete" : "Partial"}
              </Badge>
            </CardTitle>
            <CardDescription>
              Upload ID: {uploadResult?.upload_id} |{" "}
              {new Date(uploadResult?.uploaded_at).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-slate-900">
                  {uploadResult?.total_rows}
                </div>
                <div className="text-sm text-slate-600">Total Records</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div className="text-2xl font-bold text-green-900">
                    {uploadResult?.successful}
                  </div>
                </div>
                <div className="text-sm text-green-700">Successful</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <div className="text-2xl font-bold text-red-900">
                    {uploadResult?.failed}
                  </div>
                </div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Success Rate</span>
                <span className="font-medium text-slate-900">
                  {successRate}%
                </span>
              </div>
            </div>

            {uploadResult?.errors.length > 0 && (
              <div className="space-y-3">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {uploadResult?.failed} record(s) failed to process. Review
                    the errors below.
                  </AlertDescription>
                </Alert>

                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium text-slate-900 w-20">
                          Row
                        </th>
                        <th className="text-left p-3 font-medium text-slate-900">
                          Beneficiary ID
                        </th>
                        <th className="text-left p-3 font-medium text-slate-900">
                          Error Reason
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadResult?.errors.map((error, idx) => (
                        <tr
                          key={idx}
                          className="border-b last:border-0 hover:bg-slate-50"
                        >
                          <td className="p-3 font-medium text-slate-900">
                            {error.row}
                          </td>
                          <td className="p-3 font-mono text-sm text-slate-700">
                            {error.beneficiary_employee_id}
                          </td>
                          <td className="p-3 text-red-700">{error.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {uploadResult?.failed === 0 && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  All records processed successfully! The offline issuances have
                  been recorded in the system.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OfflineReportsUpload;
