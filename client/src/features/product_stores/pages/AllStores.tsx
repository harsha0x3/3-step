// src/features/product_stores/pages/AllStores.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useGetAllStoresQuery } from "../store/productStoresApiSlice";
import StoreTable from "../components/StoresTable";
import { useSelector } from "react-redux";
import { selectAuth } from "@/features/auth/store/authSlice";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { CityCombobox } from "../components/CityCombobox";
import { Button } from "@/components/ui/button";
import Hint from "@/components/ui/hint";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  Check,
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  RefreshCcw,
  ArrowBigLeftDashIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
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
  const storePage = parseInt(searchParams.get("storePage") || "1", 10);
  const storePageSize = parseInt(searchParams.get("storePageSize") || "15", 10);
  const storeSortBy = searchParams.get("storeSortBy") || "created_at";
  const storeSortOrder = searchParams.get("storeSortOrder") || "desc";
  const [selectedCity, setSelectedCity] = useState<string>(storeSearchTerm);

  const storeQueryParams = useMemo(
    () => ({
      page: storePage,
      page_size: storePageSize,
      sort_by: storeSortBy,
      sort_order: storeSortOrder,
      search_by: storeSearchBy,
      search_term: storeSearchTerm,
    }),
    [
      storePage,
      storePageSize,
      storeSortBy,
      storeSortOrder,
      storeSearchBy,
      storeSearchTerm,
    ]
  );

  const {
    data: allStoresData,
    isLoading: isFetchingStores,
    error: storesFetchError,
    refetch,
    isFetching,
  } = useGetAllStoresQuery(storeQueryParams, {
    skip:
      currentUserInfo.role !== "admin" &&
      currentUserInfo.role !== "super_admin" &&
      currentUserInfo.role !== "registration_officer",
    refetchOnMountOrArgChange: true,
  });

  if (
    currentUserInfo.role !== "admin" &&
    currentUserInfo.role !== "super_admin" &&
    currentUserInfo.role !== "registration_officer"
  ) {
    navigate("/");
  }

  const updateSearchParams = (updates: object) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null) newParams.delete(key);
      else newParams.set(key, String(value));
    });
    setSearchParams(newParams);
  };

  useEffect(() => {
    updateSearchParams({
      storeSearchTerm: selectedCity,
      storeSearchBy: "city",
      storePage: 1,
    });
  }, [selectedCity]);

  const goToPage = (page: number) => {
    updateSearchParams({ storePage: page });
  };

  const totalStores = allStoresData?.data?.count ?? 0;
  const totalStock = allStoresData?.data?.total_stock ?? 0;

  return (
    <div className="flex flex-col gap-2 sm:px-1 sm:py-0">
      {fromDashboard && (
        <div className="w-full flex justify-start">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 w-fit text-blue-500 underline"
          >
            <ArrowBigLeftDashIcon />
            Back to Stats
          </Button>
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-2 flex-wrap">
        {" "}
        <div className="flex items-center gap-2">
          <CityCombobox
            value={selectedCity}
            onChange={(val) => setSelectedCity(val)}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="px-2">
                <SlidersHorizontalIcon className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-60">
              <DropdownMenuLabel>Store Filters</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {/* SEARCH BY */}
                {/* <DropdownMenuSub>
                <DropdownMenuSubTrigger>Search By</DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      onClick={() =>
                        updateSearchParams({
                          storeSearchBy: "city",
                          storePage: 1,
                        })
                      }
                    >
                      {storeSearchBy === "city" && (
                        <Check className="mr-2 h-4 w-4" />
                      )}
                      City
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        updateSearchParams({
                          storeSearchBy: "name",
                          storePage: 1,
                        })
                      }
                    >
                      {storeSearchBy === "name" && (
                        <Check className="mr-2 h-4 w-4" />
                      )}
                      Name
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub> */}

                {/* SORT ORDER */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Sort Order</DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem
                        onClick={() =>
                          updateSearchParams({
                            storeSortOrder: "asc",
                            storePage: 1,
                          })
                        }
                      >
                        {storeSortOrder === "asc" && (
                          <Check className="mr-2 h-4 w-4" />
                        )}
                        Ascending
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          updateSearchParams({
                            storeSortOrder: "desc",
                            storePage: 1,
                          })
                        }
                      >
                        {storeSortOrder === "desc" && (
                          <Check className="mr-2 h-4 w-4" />
                        )}
                        Descending
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                {/* SORT BY */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Sort By</DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      {["created_at", "updated_at", "name", "city"].map(
                        (field) => (
                          <DropdownMenuItem
                            key={field}
                            onClick={() =>
                              updateSearchParams({
                                storeSortBy: field,
                                storePage: 1,
                              })
                            }
                          >
                            {storeSortBy === field && (
                              <Check className="mr-2 h-4 w-4" />
                            )}
                            {field.replace("_", " ").toUpperCase()}
                          </DropdownMenuItem>
                        )
                      )}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex gap-2 w-full sm:w-auto px-2 justify-between items-center">
          <Hint label="Refresh stores data.">
            <Button
              onClick={async () => {
                try {
                  await refetch().unwrap();
                } catch (err) {
                  const errMsg: string =
                    err?.data?.detail?.msg ??
                    err?.data?.detail ??
                    "Error refreshing stores data";

                  const errDesc = err?.data?.detail?.msg
                    ? err?.data?.detail?.err_stack
                    : "";
                  toast.error(errMsg, { description: errDesc });
                }
              }}
            >
              <RefreshCcw className={`${isFetching ? "animate-spin" : ""}`} />{" "}
              Refresh
            </Button>
          </Hint>
          <div className="flex gap-2 items-center">
            <p className="">Total Stores: {totalStores}</p>
            <p>|</p>
            <p>Total Stock: {totalStock}</p>
            <p>|</p>
            <p>
              Page {storePage} of {Math.ceil(totalStores / storePageSize)}
            </p>
          </div>
        </div>
      </div>
      <div className="flex-1">
        <StoreTable
          stores={allStoresData?.data.stores ?? []}
          isLoading={isFetchingStores}
          error={storesFetchError?.data?.detail ?? ""}
        />
      </div>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink size="icon" onClick={() => goToPage(1)}>
              <ChevronFirstIcon />
            </PaginationLink>
          </PaginationItem>

          <PaginationItem>
            <PaginationLink
              size="icon"
              onClick={() => storePage > 1 && goToPage(storePage - 1)}
            >
              <ChevronLeftIcon />
            </PaginationLink>
          </PaginationItem>

          <PaginationItem>
            <Select
              value={String(storePage)}
              onValueChange={(v) => goToPage(Number(v))}
            >
              <SelectTrigger className="w-fit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from(
                  { length: Math.ceil(totalStores / storePageSize || 1) },
                  (_, i) => i + 1
                ).map((p) => (
                  <SelectItem key={p} value={String(p)}>
                    Page {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </PaginationItem>

          <PaginationItem>
            <PaginationLink
              size="icon"
              onClick={() =>
                storePage < Math.ceil(totalStores / storePageSize) &&
                goToPage(storePage + 1)
              }
            >
              <ChevronRightIcon />
            </PaginationLink>
          </PaginationItem>

          <PaginationItem>
            <PaginationLink
              size="icon"
              onClick={() => goToPage(Math.ceil(totalStores / storePageSize))}
            >
              <ChevronLastIcon />
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default AllStores;
