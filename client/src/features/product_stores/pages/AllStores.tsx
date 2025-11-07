// src/features/product_stores/pages/AllStores.tsx
import React from "react";
import { useGetAllStoresQuery } from "../store/productStoresApiSlice";
import StoreTable from "../components/StoresTable";
import { useSelector } from "react-redux";
import { selectAuth } from "@/features/auth/store/authSlice";
import { useNavigate } from "react-router-dom";
import StoreFormDialog from "../components/StoreFormDialog";

const AllStores: React.FC = () => {
  const currentUserInfo = useSelector(selectAuth);
  const navigate = useNavigate();

  const {
    data: allStoresData,
    isLoading: isFetchingStores,
    error: storesFetchError,
  } = useGetAllStoresQuery(
    { searchBy: "store_name", searchTerm: "" },
    {
      skip: currentUserInfo.role !== "admin",
    }
  );

  if (currentUserInfo.role !== "admin") {
    navigate("/");
  }
  console.log("ALL STORES DATA", allStoresData);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <div />
        <StoreFormDialog />
      </div>
      <div className="flex-1">
        <StoreTable
          stores={allStoresData?.data.stores}
          isLoading={isFetchingStores}
          error={storesFetchError?.data?.detail ?? ""}
        />
      </div>
    </div>
  );
};

export default AllStores;
