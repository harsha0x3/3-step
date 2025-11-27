import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { selectAuth } from "@/features/auth/store/authSlice";
import { useGetAllVendorSpocQuery } from "../store/vendorsApiSlice";
import VendorSpocTable from "../components/VendorSpocTable";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowBigLeftDashIcon } from "lucide-react";
// import VendorSpocFormDialog from "../components/VendorSpocFormDialog";

const AllVendorSpoc: React.FC = () => {
  const currentUserInfo = useSelector(selectAuth);
  const location = useLocation();
  const navigate = useNavigate();

  const fromDashboardRef = useRef(location.state?.from === "dashboard");
  const fromDashboard = fromDashboardRef.current;

  const {
    data: vendorSpocData,
    isLoading: isFetchingVendorSpocs,
    error: vendorSpocError,
  } = useGetAllVendorSpocQuery(
    { searchTerm: "" },
    {
      skip:
        currentUserInfo.role !== "admin" &&
        currentUserInfo.role !== "super_admin" &&
        currentUserInfo.role !== "registration_officer",
    }
  );

  useEffect(() => {
    if (vendorSpocError)
      console.error("❌ Vendor SPOC fetch error:", vendorSpocError);
  }, [vendorSpocError]);

  const vendorSpocList = vendorSpocData?.data ?? [];

  if (currentUserInfo.role === "store_agent") {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {/* {["admin", "super_admin"].includes(currentUserInfo.role) && (
        <div className="flex justify-between items-center">
          <div />
          <VendorSpocFormDialog />
        </div>
      )} */}
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
        <VendorSpocTable
          vendorSpocs={vendorSpocList}
          isLoading={isFetchingVendorSpocs}
          error={
            vendorSpocError
              ? vendorSpocError?.data?.detail ??
                "An error occurred while fetching vendor SPOCs"
              : ""
          }
        />
      </div>
    </div>
  );
};

export default AllVendorSpoc;
