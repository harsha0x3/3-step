// src/layouts/Header.tsx
import { selectAuth } from "@/features/auth/store/authSlice";
import { useGetUserStoreQuery } from "@/features/product_stores/store/productStoresApiSlice";
import { Loader } from "lucide-react";
import React from "react";
import { useSelector } from "react-redux";

const Header: React.FC = () => {
  const currentUserInfo = useSelector(selectAuth);
  const { data: userStore, isLoading } = useGetUserStoreQuery(undefined, {
    skip: currentUserInfo.role !== "store_personnel",
  });
  if (isLoading) {
    return <Loader className="animate-spin w-7 h-7" />;
  }

  return (
    <div className="w-full h-10 bg-accent text-accent-foreground text-xl font-bold capitalize">
      {currentUserInfo.role === "store_personnel" ? (
        isLoading ? (
          <Loader className="animate-spin w-7 h-7" />
        ) : (
          userStore?.data?.store?.store_name
        )
      ) : (
        currentUserInfo.username
      )}
    </div>
  );
};

export default Header;
