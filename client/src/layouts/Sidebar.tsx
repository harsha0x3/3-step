import { Button } from "@/components/ui/button";
import { selectUserRole } from "@/features/auth/store/authSlice";
import { LayoutDashboardIcon, UsersRoundIcon } from "lucide-react";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const Sidebar: React.FC = () => {
  const [selectedItemLabel, setSelectedItemLabel] = useState<string>("Home");
  const navigate = useNavigate();
  const currentUserRole = useSelector(selectUserRole);

  return (
    <div className="h-screen bg-sidebar text-sidebar-foreground w-44 flex flex-col justify-between items-center py-4">
      <div className="flex flex-col gap-2">
        <Button
          className="bg-transparent hover:bg-sidebar-accent hover:cursor-pointer hover:text-sidebar-accent-foreground text-sidebar-foreground"
          variant={
            selectedItemLabel === "admin-dashboard" ? "outline" : "secondary"
          }
          onClick={() => {
            setSelectedItemLabel("admin-dashboard");
            navigate("/admin/dashboard");
          }}
        >
          <LayoutDashboardIcon />
          Dashboard
        </Button>
        <Button
          className="bg-transparent hover:bg-sidebar-accent hover:cursor-pointer hover:text-sidebar-accent-foreground text-sidebar-foreground"
          variant={selectedItemLabel === "candidates" ? "outline" : "secondary"}
          onClick={() => {
            setSelectedItemLabel("candidates");
            switch (currentUserRole) {
              case "admin":
                navigate("/admin/candidates");
                break;
              case "verifier":
                navigate("/verifier/candidates");
                break;
              case "store_personnel":
                navigate("/store/candidates");
                break;
            }
          }}
        >
          <UsersRoundIcon />
          Candidates
        </Button>
        {currentUserRole === "admin" && (
          <div>
            <Button
              className="bg-transparent hover:bg-sidebar-accent hover:cursor-pointer hover:text-sidebar-accent-foreground text-sidebar-foreground"
              variant={
                selectedItemLabel === "vendors" ? "outline" : "secondary"
              }
              onClick={() => {
                setSelectedItemLabel("vendors");
                switch (currentUserRole) {
                  case "admin":
                    navigate("/admin/vendors");
                    break;
                }
              }}
            >
              Stores
            </Button>

            <Button
              className="bg-transparent hover:bg-sidebar-accent hover:cursor-pointer hover:text-sidebar-accent-foreground text-sidebar-foreground"
              variant={selectedItemLabel === "stores" ? "outline" : "secondary"}
              onClick={() => {
                setSelectedItemLabel("vendors");
                switch (currentUserRole) {
                  case "admin":
                    navigate("/admin/vendors");
                    break;
                }
              }}
            >
              Vendors
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
