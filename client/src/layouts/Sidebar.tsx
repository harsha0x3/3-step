import { Button } from "@/components/ui/button";
import { selectUserRole } from "@/features/auth/store/authSlice";
import {
  LayoutDashboardIcon,
  UsersRoundIcon,
  StoreIcon,
  Users2Icon,
  UserCircle2Icon,
} from "lucide-react";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const Sidebar: React.FC = () => {
  const [selectedItemLabel, setSelectedItemLabel] = useState<string>("Home");
  const navigate = useNavigate();
  const currentUserRole = useSelector(selectUserRole);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 md:relative md:h-screen 
                bg-sidebar w-full md:w-44 flex md:flex-col 
                flex-row justify-around md:justify-start items-center 
                py-2 md:py-4 z-50 border-t md:border-t-0 md:border-r border-sidebar-border"
    >
      <div className="flex flex-row md:flex-col gap-1 md:gap-2 w-full md:w-auto justify-around md:justify-start px-2 md:px-0">
        <Button
          size="sm"
          className="bg-transparent hover:bg-sidebar-accent hover:cursor-pointer hover:text-sidebar-accent-foreground text-sidebar-foreground flex-col md:flex-row h-auto md:h-9 py-2 md:py-2 px-2 md:px-4 gap-0 md:gap-2 text-xs md:text-sm"
          variant={
            selectedItemLabel === "admin-dashboard" ? "outline" : "ghost"
          }
          onClick={() => {
            setSelectedItemLabel("admin-dashboard");
            navigate("/admin/dashboard");
          }}
        >
          <LayoutDashboardIcon className="w-5 h-5 md:w-4 md:h-4" />
          <span className="text-[10px] md:text-sm">Dashboard</span>
        </Button>

        <Button
          size="sm"
          className="bg-transparent hover:bg-sidebar-accent hover:cursor-pointer hover:text-sidebar-accent-foreground text-sidebar-foreground flex-col md:flex-row h-auto md:h-9 py-2 md:py-2 px-2 md:px-4 gap-0 md:gap-2 text-xs md:text-sm"
          variant={selectedItemLabel === "candidates" ? "outline" : "ghost"}
          onClick={() => {
            setSelectedItemLabel("candidates");
            switch (currentUserRole) {
              case "admin":
                navigate("/admin/candidates");
                break;
              case "super_admin":
                navigate("/admin/candidates");
                break;
              case "registration_officer":
                navigate("/verifier/candidates");
                break;
              case "store_agent":
                navigate("/store/candidates");
                break;
            }
          }}
        >
          <UsersRoundIcon className="w-5 h-5 md:w-4 md:h-4" />
          <span className="text-[10px] md:text-sm">Candidates</span>
        </Button>

        {currentUserRole === "admin" ||
          (currentUserRole === "super_admin" && (
            <Button
              size="sm"
              className="bg-transparent hover:bg-sidebar-accent hover:cursor-pointer hover:text-sidebar-accent-foreground text-sidebar-foreground flex-col md:flex-row h-auto md:h-9 py-2 md:py-2 px-2 md:px-4 gap-0 md:gap-2 text-xs md:text-sm"
              variant={selectedItemLabel === "stores" ? "outline" : "ghost"}
              onClick={() => {
                setSelectedItemLabel("stores");
                navigate("/admin/stores");
              }}
            >
              <StoreIcon className="w-5 h-5 md:w-4 md:h-4" />
              <span className="text-[10px] md:text-sm">Stores</span>
            </Button>
          ))}

        {(currentUserRole === "admin" ||
          currentUserRole === "super_admin" ||
          currentUserRole === "registration_officer") && (
          <>
            <Button
              size="sm"
              className="bg-transparent hover:bg-sidebar-accent hover:cursor-pointer hover:text-sidebar-accent-foreground text-sidebar-foreground flex-col md:flex-row h-auto md:h-9 py-2 md:py-2 px-2 md:px-4 gap-0 md:gap-2 text-xs md:text-sm"
              variant={selectedItemLabel === "vendors" ? "outline" : "ghost"}
              onClick={() => {
                setSelectedItemLabel("vendors");
                navigate("vendors");
              }}
            >
              <Users2Icon className="w-5 h-5 md:w-4 md:h-4" />
              <span className="text-[10px] md:text-sm">Vendors</span>
            </Button>

            <Button
              size="sm"
              className="bg-transparent hover:bg-sidebar-accent hover:cursor-pointer hover:text-sidebar-accent-foreground text-sidebar-foreground flex-col md:flex-row h-auto md:h-9 py-2 md:py-2 px-2 md:px-4 gap-0 md:gap-2 text-xs md:text-sm"
              variant={
                selectedItemLabel === "vendor_spoc" ? "outline" : "ghost"
              }
              onClick={() => {
                setSelectedItemLabel("vendor_spoc");
                navigate("vendor_spoc");
              }}
            >
              <UserCircle2Icon className="w-5 h-5 md:w-4 md:h-4" />
              <span className="text-[10px] md:text-sm hidden md:inline">
                Vendor SPOC
              </span>
              <span className="text-[10px] md:hidden">SPOC</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
