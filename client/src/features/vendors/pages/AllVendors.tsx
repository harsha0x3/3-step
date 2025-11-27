import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { selectAuth } from "@/features/auth/store/authSlice";
import { useGetAllVendorsQuery } from "../store/vendorsApiSlice";
import VendorsTable from "../components/VendorsTable";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowBigLeftDashIcon } from "lucide-react";
// import VendorFormDialog from "../components/VendorFormDialog";

const AllVendors: React.FC = () => {
  const currentUserInfo = useSelector(selectAuth);
  const location = useLocation();
  const navigate = useNavigate();

  const fromDashboardRef = useRef(location.state?.from === "dashboard");
  const fromDashboard = fromDashboardRef.current;

  const {
    data: vendorsData,
    isLoading: isFetchingVendors,
    error: vendorsFetchError,
  } = useGetAllVendorsQuery(
    { searchTerm: "" },
    {
      skip:
        currentUserInfo.role !== "admin" &&
        currentUserInfo.role !== "super_admin" &&
        currentUserInfo.role !== "registration_officer",
    }
  );

  useEffect(() => {
    if (vendorsFetchError) {
      console.error("❌ Vendors Fetch Error:", vendorsFetchError);
    }
  }, [vendorsFetchError]);

  const vendorsList = vendorsData?.data ?? [];

  if (currentUserInfo.role === "store_agent") {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {/* <div className="flex justify-between items-center">
        <div />
        <VendorFormDialog />
      </div> */}
      {fromDashboard && (
        <div className="w-full flex justify-start">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 w-fit text-blue-500 underline"
          >
            <ArrowBigLeftDashIcon />
            Back to Dashboard
          </Button>
        </div>
      )}
      <div className="flex-1">
        <VendorsTable
          vendors={vendorsList}
          isLoading={isFetchingVendors}
          error={
            vendorsFetchError
              ? vendorsFetchError?.data?.detail ??
                "An error occurred while fetching vendors"
              : ""
          }
        />
      </div>
    </div>
  );
};

export default AllVendors;
