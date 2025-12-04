import { Button } from "@/components/ui/button";
import { useLogoutMutation } from "@/features/auth/store/authApiSlice";
import { selectAuth } from "@/features/auth/store/authSlice";
import { useGetUserStoreQuery } from "@/features/product_stores/store/productStoresApiSlice";
import { Loader } from "lucide-react";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";

const Header: React.FC = () => {
  const currentUserInfo = useSelector(selectAuth);
  const location = useLocation();
  const [logout, { isLoading: loggingOut }] = useLogoutMutation();
  const { data: userStore, isLoading } = useGetUserStoreQuery(undefined, {
    skip: currentUserInfo.role !== "store_agent",
  });

  // Get current module name based on route
  const currentModule = useMemo(() => {
    const path = location.pathname;

    if (path.includes("/dashboard")) {
      if (currentUserInfo.role === "store_agent") return "Dashboard";
      else return "Overall Statistics";
    }
    if (path.includes("/stores")) return "Store Details";
    if (path.includes("/admin/users")) return "User Management";
    if (path.includes("/registration_officer/beneficiary/verify"))
      return "Issue Voucher";
    if (path.includes("/beneficiary/all")) return "Beneficiary Details";
    if (path.includes("/store/beneficiary")) return "Laptop Distribution";
    if (path.includes("/vendors") && !path.includes("spoc"))
      return "Vendors Details";
    if (path.includes("/vendor_spoc")) return "Vendor Contact Persons Details";
    if (path.includes("registration_officer/stores")) return "Store Details";

    return "Dashboard";
  }, [location.pathname, currentUserInfo.role]);

  if (isLoading) {
    return <Loader className="animate-spin w-5 h-5" />;
  }

  return (
    <div className="w-full border-b border-sidebar-border bg-background px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <h1 className="text-xl md:text-2xl font-bold text-foreground ml-12 md:ml-0">
          {currentModule}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground hidden md:inline">Hello,</span>
          <span className="font-medium">
            {currentUserInfo.role === "store_agent" ? (
              isLoading ? (
                <Loader className="animate-spin w-4 h-4" />
              ) : (
                userStore?.data?.store?.name
              )
            ) : (
              currentUserInfo.full_name
            )}
          </span>
        </div>

        <span className="text-muted-foreground hidden md:inline">|</span>

        <Button
          variant="ghost"
          size="sm"
          disabled={loggingOut}
          onClick={async () => {
            try {
              await logout(undefined).unwrap();
            } catch (err: any) {
              const errMsg: string =
                err?.data?.detail?.msg ??
                err?.data?.detail ??
                "Error logging out";
              const errDesc = err?.data?.detail?.msg
                ? err?.data?.detail?.err_stack
                : "";
              toast.error(errMsg, { description: errDesc });
            }
          }}
        >
          {loggingOut ? <Loader className="animate-spin w-4 h-4" /> : "Logout"}
        </Button>
      </div>
    </div>
  );
};

export default Header;
