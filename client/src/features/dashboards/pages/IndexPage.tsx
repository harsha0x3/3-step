import React from "react";
import {
  useDownloadCandidatesMutation,
  useGetDashboardStatsQuery,
} from "../store/dashboardApiSlice";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, LucideRefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Hint from "@/components/ui/hint";

const IndexPage: React.FC = () => {
  const [downloadData, { isLoading }] = useDownloadCandidatesMutation();
  const {
    data: statsData,
    isLoading: isLoadingStatsData,
    isError: statusFetchError,
    refetch,
  } = useGetDashboardStatsQuery();

  if (isLoadingStatsData)
    return (
      <div className="h-[70vh] flex justify-center items-center">
        <Loader2 className="animate-spin w-10 h-10" />
      </div>
    );

  if (statusFetchError)
    return (
      <div className="h-[70vh] flex justify-center items-center text-red-500">
        Failed to load stats
      </div>
    );

  const stats = statsData?.data;

  const handleDownloadCandidates = async () => {
    try {
      const blob = await downloadData().unwrap(); // <-- this returns the Blob

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "benefeciary_employees_data_with_voucher_and_store.xlsx"; // file name
      a.click();
      window.URL.revokeObjectURL(url); // cleanup
    } catch (err) {
      const errMsg: string =
        err?.data?.detail?.msg ??
        err?.data?.detail ??
        "Error downloading details";

      const errDesc = err?.data?.detail?.msg
        ? err?.data?.detail?.err_stack
        : "";
      toast.error(errMsg, { description: errDesc });
    }
  };
  return (
    <div className="p-6 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Downloads</CardTitle>
        </CardHeader>
        <CardContent className="w-full">
          <Hint label="Download the employee details with voucher codes as Excel file">
            <Button onClick={handleDownloadCandidates}>
              {isLoading ? "Downloading..." : "Download Employee details"}
            </Button>
          </Hint>
        </CardContent>
      </Card>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">📊 Dashboard Overview</h1>
        <Button
          variant={"secondary"}
          disabled={isLoadingStatsData}
          onClick={async () => {
            try {
              await refetch().unwrap();
            } catch (err) {
              const errMsg: string =
                err?.data?.detail?.msg ??
                err?.data?.detail ??
                "Error downloading details";

              const errDesc = err?.data?.detail?.msg
                ? err?.data?.detail?.err_stack
                : "";
              toast.error(errMsg, { description: errDesc });
            }
          }}
        >
          <LucideRefreshCw
            className={`w-4 h-4 ${isLoadingStatsData ? "animate-spin" : ""}`}
          />{" "}
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Candidates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-blue-600">
              {stats?.count_of_total_candidates}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verified Candidates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-green-600">
              {stats?.count_of_verified_candidates}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Laptops Issued</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-purple-600">
              {stats?.count_of_candidate_recieved_laptops}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Stores</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-orange-600">
              {stats?.count_of_stores}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IndexPage;
