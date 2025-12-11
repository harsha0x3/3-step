import { Button } from "@/components/ui/button";
import { selectUserRole } from "@/features/auth/store/authSlice";
import {
  LayoutDashboardIcon,
  UsersRoundIcon,
  StoreIcon,
  Users2Icon,
  UserCircle2Icon,
  ChevronDown,
  ChevronRight,
  TicketIcon,
  LaptopIcon,
  BarChart3Icon,
  Menu,
  X,
  CopyPlusIcon,
  WifiOff,
  ArrowBigUpDashIcon,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";

interface MenuItem {
  label: string;
  icon: React.ElementType;
  path?: string;
  roles: string[];
  children?: MenuItem[];
}

interface SidebarItemProps {
  item: MenuItem;
  depth?: number;
  onNavigate: (path: string) => void;
  isActiveRoute: (path?: string) => boolean;
  hasAccessToItem: (roles: string[]) => boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  item,
  depth = 0,
  onNavigate,
  isActiveRoute,
  hasAccessToItem,
}) => {
  const [open, setOpen] = useState(true);

  if (!hasAccessToItem(item.roles)) return null;

  const Icon = item.icon;
  const isActive = isActiveRoute(item.path);
  const hasChildren = !!item.children?.length;

  // ✅ COLLAPSIBLE MENU
  if (hasChildren) {
    return (
      <Collapsible open={open} onOpenChange={setOpen} className="w-full">
        <CollapsibleTrigger asChild>
          <Button
            size="sm"
            className={`bg-transparent w-full hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
      text-sidebar-foreground flex items-center justify-start h-9 py-2 gap-2 text-sm
      ${depth > 0 ? "pl-8" : "px-2"}
    `}
            variant={isActive ? "outline" : "ghost"}
            onClick={() => item.path && onNavigate(item.path)}
          >
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </div>
            {open ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="pl-4">
          <div className="flex flex-col gap-1 mt-1 pl-1 border-l-2">
            {item.children?.map((child) => (
              <SidebarItem
                key={child.label}
                item={child}
                depth={depth + 1}
                onNavigate={onNavigate}
                isActiveRoute={isActiveRoute}
                hasAccessToItem={hasAccessToItem}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  // ✅ LEAF MENU
  return (
    <Button
      size="sm"
      className={`bg-transparent w-full hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
        text-sidebar-foreground flex items-center justify-start h-9 py-2 gap-2 text-sm
        ${depth > 0 ? "pl-8" : "px-4"}
      `}
      variant={isActive ? "outline" : "ghost"}
      onClick={() => item.path && onNavigate(item.path)}
    >
      <Icon className="w-4 h-4" />
      <span>{item.label}</span>
    </Button>
  );
};

const Sidebar: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const currentUserRole = useSelector(selectUserRole);

  const menuItems: MenuItem[] = [
    {
      label: "Dashboards",
      icon: LayoutDashboardIcon,
      roles: ["admin", "super_admin", "registration_officer"],
      children: [
        {
          label: "Stats",
          icon: BarChart3Icon,
          path: "/dashboard",
          roles: [
            "admin",
            "super_admin",
            "registration_officer",
            "store_agent",
          ],
        },
        {
          label: "Beneficiaries",
          icon: UsersRoundIcon,
          path: "/beneficiary/all",
          roles: ["admin", "super_admin", "registration_officer"],
        },
        {
          label: "Stores",
          icon: StoreIcon,
          path: "/stores",
          roles: ["admin", "super_admin", "registration_officer"],
        },
        {
          label: "Vendors",
          icon: Users2Icon,
          path: "/vendors",
          roles: ["admin", "super_admin"],
        },
        {
          label: "Vendor Contact Persons",
          icon: UserCircle2Icon,
          path: "/vendor_spoc",
          roles: ["admin", "super_admin", "registration_officer"],
        },
        // {
        //   label: "Offline Reports",
        //   icon: WifiOff,
        //   path: "/store/offline-reports",
        //   roles: ["admin", "super_admin"],
        // },
      ],
    },
    {
      label: "Register",
      icon: CopyPlusIcon,
      roles: ["admin", "super_admin", "registration_officer"],
      children: [
        {
          label: "Beneficiary",
          icon: UsersRoundIcon,
          path: "/admin/beneficiary/new",
          roles: ["admin", "super_admin"],
        },
        {
          label: "Store",
          icon: StoreIcon,
          path: "/admin/stores/new",
          roles: ["admin", "super_admin"],
        },
        {
          label: "Vendor",
          icon: Users2Icon,
          path: "/vendors/new",
          roles: ["admin", "super_admin"],
        },
        {
          label: "Vendor Contact Person",
          icon: UserCircle2Icon,
          path: "/vendor_spoc/new",
          roles: ["admin", "super_admin", "registration_officer"],
        },
      ],
    },
    {
      label: "User Management",
      icon: Users2Icon,
      path: "/admin/users",
      roles: ["admin", "super_admin"],
    },
    {
      label: "Issue Voucher",
      icon: TicketIcon,
      path: "/registration_officer/beneficiary/verify",
      roles: ["registration_officer"],
    },
    {
      label: "Dashboard",
      icon: LayoutDashboardIcon,
      path: "/dashboard",
      roles: ["store_agent"],
    },
    // {
    //   label: "Offline Reports",
    //   icon: WifiOff,
    //   path: "/store/offline-reports",
    //   roles: ["store_agent"],
    // },
    {
      label: "Laptop Distribution",
      icon: LaptopIcon,
      path: "/store/beneficiary",
      roles: ["store_agent"],
    },
    {
      label: "Upgrade Latop",
      icon: ArrowBigUpDashIcon,
      path: "/store/upgrade-request",
      roles: ["store_agent"],
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileOpen(false);
  };

  const isActiveRoute = (path?: string) => {
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const hasAccessToItem = (roles: string[]) => {
    return roles.includes(currentUserRole);
  };

  // const renderMenuItem = (item: MenuItem, depth: number = 0) => {
  //   if (!hasAccessToItem(item.roles)) return null;

  //   const Icon = item.icon;
  //   const isActive = isActiveRoute(item.path);
  //   const hasChildren = !!item.children?.length;

  //   // If menu has children → Collapsible section
  //   if (hasChildren) {
  //     const [open, setOpen] = useState(true); // default open; set false if you want collapsed initially

  //     return (
  //       <Collapsible
  //         key={item.label}
  //         open={open}
  //         onOpenChange={setOpen}
  //         className="w-full"
  //       >
  //         <CollapsibleTrigger asChild>
  //           <Button
  //             size="sm"
  //             variant="ghost"
  //             className={`bg-transparent w-full hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground flex items-center justify-between h-9 py-2 px-4 gap-2 text-sm ${
  //               depth > 0 ? "pl-8" : ""
  //             }`}
  //           >
  //             <div className="flex items-center gap-2">
  //               <Icon className="w-4 h-4" />
  //               <span>{item.label}</span>
  //             </div>
  //             {open ? (
  //               <ChevronDown className="w-4 h-4" />
  //             ) : (
  //               <ChevronRight className="w-4 h-4" />
  //             )}
  //           </Button>
  //         </CollapsibleTrigger>

  //         <CollapsibleContent>
  //           <div className="flex flex-col gap-1 mt-1 pl-2">
  //             {item.children?.map((child) => renderMenuItem(child, depth + 1))}
  //           </div>
  //         </CollapsibleContent>
  //       </Collapsible>
  //     );
  //   }

  //   // If leaf menu → normal nav button
  //   return (
  //     <Button
  //       key={item.label}
  //       size="sm"
  //       className={`bg-transparent w-full hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground flex items-center justify-start h-9 py-2 gap-2 text-sm ${
  //         depth > 0 ? "pl-8" : "px-4"
  //       }`}
  //       variant={isActive ? "outline" : "ghost"}
  //       onClick={() => item.path && handleNavigation(item.path)}
  //     >
  //       <Icon className="w-4 h-4" />
  //       <span>{item.label}</span>
  //     </Button>
  //   );
  // };

  const sidebarContent = (
    <div className="flex flex-col gap-1 w-full px-2 py-4">
      {menuItems.map((item) => (
        <SidebarItem
          key={item.label}
          item={item}
          onNavigate={handleNavigation}
          isActiveRoute={isActiveRoute}
          hasAccessToItem={hasAccessToItem}
        />
      ))}
    </div>
  );

  return (
    <>
      {/* Mobile Hamburger Button */}
      <Button
        className="md:hidden fixed top-4 left-4 z-50 bg-sidebar hover:bg-sidebar-accent"
        size="sm"
        variant="ghost"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? (
          <X className="w-5 h-5 text-sidebar-foreground" />
        ) : (
          <Menu className="w-5 h-5 text-sidebar-foreground" />
        )}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed md:relative inset-y-0 left-0 z-40
          bg-sidebar w-64 md:w-60 h-screen
          border-r border-sidebar-border
          transform transition-transform duration-200 ease-in-out
          ${
            isMobileOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }
          overflow-y-auto
        `}
      >
        {/* Logo/Brand Area */}
        <div className="h-16 flex items-center justify-center border-b border-sidebar-border">
          <h1 className="text-lg font-semibold text-sidebar-foreground">
            {currentUserRole === "admin" || currentUserRole === "super_admin"
              ? "Admin User"
              : currentUserRole === "registration_officer"
              ? "Voucher Distrubuter"
              : "Store User"}
          </h1>
        </div>

        {sidebarContent}
      </div>
    </>
  );
};

export default Sidebar;
