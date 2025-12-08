//src/layouts/ProtectedLayout.tsx

import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  selectIsAuthenticated,
  selectIsLoading,
  selectUserRole,
} from "@/features/auth/store/authSlice";
import { Loader } from "lucide-react";

const ProtectedLayout: React.FC = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectIsLoading);
  const currentUserRole = useSelector(selectUserRole);

  const location = useLocation();
  const navigate = useNavigate();

  const fromPath = location.state?.from?.pathname || "/dashboard";
  const fromSearch = location.state?.from?.search || "";
  const from = `${fromPath}${fromSearch}`;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location }, replace: true });
      console.log("NOT LOGGED IN");
      return;
    }
    // else {
    //   navigate(from, { replace: true });
    //   return;
    // }

    //   switch (currentUserRole) {
    //     case "admin":
    //       navigate("/dashboard", { state: { from: location }, replace: true });
    //       break;
    //     case "super_admin":
    //       navigate("/dashboard", { state: { from: location }, replace: true });
    //       break;

    //     case "store_agent":
    //       navigate("/dashboard", {
    //         state: { from: location },
    //         replace: true,
    //       });
    //       break;
    //     case "registration_officer":
    //       navigate("/dashboard", {
    //         state: { from: location },
    //         replace: true,
    //       });
    //       break;

    //     default:
    //       break;
    //   }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent">
        <Loader className="w-8 h-8" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={"/login"} state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedLayout;
