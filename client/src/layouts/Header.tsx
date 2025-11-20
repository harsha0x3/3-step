// src/layouts/Header.tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogoutMutation } from "@/features/auth/store/authApiSlice";
import { selectAuth } from "@/features/auth/store/authSlice";
import { useGetUserStoreQuery } from "@/features/product_stores/store/productStoresApiSlice";
import { DropdownMenuItem } from "@radix-ui/react-dropdown-menu";
import { ChevronDown, Loader } from "lucide-react";
import React from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";

const Header: React.FC = () => {
  const currentUserInfo = useSelector(selectAuth);
  const [logout, { isLoading: loggingOut }] = useLogoutMutation();
  const { data: userStore, isLoading } = useGetUserStoreQuery(undefined, {
    skip: currentUserInfo.role !== "store_agent",
  });
  if (isLoading) {
    return <Loader className="animate-spin w-7 h-7" />;
  }

  return (
    <div
      className="w-full h-12 md:h-10 px-4 bg-accent 
                text-accent-foreground text-lg md:text-xl 
                font-bold capitalize flex items-center justify-between"
    >
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center justify-between hover:cursor-pointer">
          {currentUserInfo.role === "store_agent" ? (
            isLoading ? (
              <Loader className="animate-spin w-7 h-7" />
            ) : (
              userStore?.data?.store?.name
            )
          ) : (
            currentUserInfo.username
          )}
          <ChevronDown className="h-5 w-5 font-bold" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-45 max-w-64">
          <DropdownMenuItem
            className="hover:cursor-pointer hover:bg-accent hover:text-accent-foreground h-7"
            onClick={async () => {
              try {
                await logout(undefined).unwrap();
              } catch (err) {
                const errMsg: string =
                  err?.data?.detail?.msg ??
                  err?.data?.detail ??
                  "Error adding candidate";

                const errDesc = err?.data?.detail?.msg
                  ? err?.data?.detail?.err_stack
                  : "";
                toast.error(errMsg, { description: errDesc });
              }
            }}
          >
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default Header;
