// src/features/product_stores/pages/AllStores.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useGetAllStoresQuery } from "../store/productStoresApiSlice";
import StoreTable from "../components/StoresTable";
import { useSelector } from "react-redux";
import { selectAuth } from "@/features/auth/store/authSlice";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { CityCombobox } from "../components/CityCombobox";
import { Button } from "@/components/ui/button";
import { ArrowBigLeftDashIcon } from "lucide-react";
// import StoreFormDialog from "../components/StoreFormDialog";

const AllStores: React.FC = () => {
  const currentUserInfo = useSelector(selectAuth);
  const location = useLocation();
  const navigate = useNavigate();

  const fromDashboardRef = useRef(location.state?.from === "dashboard");
  const fromDashboard = fromDashboardRef.current;
  const [searchParams, setSearchParams] = useSearchParams();

  const storeSearchBy = searchParams.get("storeSearchBy") || "city";
  const storeSearchTerm = searchParams.get("storeSearchTerm") || "";
  const [selectedCity, setSelectedCity] = useState<string>(storeSearchTerm);

  useEffect(() => {
    setSearchParams({ storeSearchTerm: selectedCity });
  }, [selectedCity]);

  const {
    data: allStoresData,
    isLoading: isFetchingStores,
    error: storesFetchError,
  } = useGetAllStoresQuery(
    selectedCity
      ? { searchBy: storeSearchBy, searchTerm: storeSearchTerm }
      : { searchBy: "name", searchTerm: "" },
    {
      skip:
        currentUserInfo.role !== "admin" &&
        currentUserInfo.role !== "super_admin" &&
        currentUserInfo.role !== "registration_officer",
    }
  );

  if (
    currentUserInfo.role !== "admin" &&
    currentUserInfo.role !== "super_admin" &&
    currentUserInfo.role !== "registration_officer"
  ) {
    navigate("/");
  }

  const cities: string[] = useMemo(() => {
    return allStoresData?.data?.cities ?? [];
  }, [allStoresData]);

  return (
    <div className="flex flex-col gap-2">
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
      <div className="flex justify-between items-center">
        <CityCombobox
          cities={cities}
          value={selectedCity}
          onChange={(val) => setSelectedCity(val)}
        />
        <div />
      </div>
      <div className="flex-1">
        <StoreTable
          stores={allStoresData?.data.stores ?? []}
          isLoading={isFetchingStores}
          error={storesFetchError?.data?.detail ?? ""}
        />
      </div>
    </div>
  );
};

export default AllStores;
