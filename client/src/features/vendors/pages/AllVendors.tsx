import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { selectAuth } from "@/features/auth/store/authSlice";
import { useGetAllVendorsQuery } from "../store/vendorsApiSlice";
import VendorsTable from "../components/VendorsTable";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowBigLeftDashIcon,
  Check,
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  RefreshCcw,
  SlidersHorizontalIcon,
} from "lucide-react";
import Hint from "@/components/ui/hint";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
import type { VendorsSearchParams, VendorItem } from "../types";

const AllVendors: React.FC = () => {
  const currentUserInfo = useSelector(selectAuth);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const fromDashboardRef = useRef(location.state?.from === "dashboard");
  const fromDashboard = fromDashboardRef.current;

  // URL params
  const vendPage = parseInt(searchParams.get("vendPage") || "1", 10);
  const vendPageSize = parseInt(searchParams.get("vendPageSize") || "15", 10);
  const vendSortBy = searchParams.get("vendSortBy") || "created_at";
  const vendSortOrder = searchParams.get("vendSortOrder") || "desc";
  const vendSearchBy = searchParams.get("vendSearchBy") || "vendor_name";
  const vendSearchTerm = searchParams.get("vendSearchTerm") || "";

  const [searchInput, setSearchInput] = useState<string>("");

  const vendSearchParams: VendorsSearchParams = useMemo(
    () => ({
      page: vendPage,
      page_size: vendPageSize,
      sort_by: vendSortBy,
      sort_order: vendSortOrder,
      search_by: vendSearchBy,
      search_term: vendSearchTerm,
    }),
    [
      vendPage,
      vendPageSize,
      vendSortBy,
      vendSortOrder,
      vendSearchBy,
      vendSearchTerm,
    ]
  );

  useEffect(() => {
    console.log("vend Search para", vendSearchParams);
  }, [vendSearchParams]);

  const {
    data: vendorsData,
    isLoading: isFetchingVendors,
    error: vendorsFetchError,
    refetch,
    isFetching,
  } = useGetAllVendorsQuery(vendSearchParams, {
    skip:
      currentUserInfo.role !== "admin" &&
      currentUserInfo.role !== "super_admin" &&
      currentUserInfo.role !== "registration_officer",
    refetchOnMountOrArgChange: true,
  });

  const totalVendors = vendorsData?.data?.total_count ?? 0;
  const vendorsList = vendorsData?.data?.vendors ?? ([] as VendorItem[]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      updateSearchParams({ vendSearchTerm: searchInput, vendPage: 1 });
    }, 500);

    return () => clearTimeout(handler);
  }, [searchInput]);

  const updateSearchParams = (updates: object) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined) newParams.delete(key);
      else newParams.set(key, String(value));
    });
    setSearchParams(newParams);
  };

  const goToPage = (page: number) => {
    updateSearchParams({ vendPage: page });
  };

  if (currentUserInfo.role === "store_agent") {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 p-2">
      {fromDashboard && (
        <div className="w-full flex justify-start">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-blue-500 underline"
          >
            <ArrowBigLeftDashIcon />
            Back to Stats
          </Button>
        </div>
      )}

      {/* Top Controls */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <Label>Search:</Label>
          <Input
            value={searchInput}
            placeholder="Search by vendor name"
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-8"
          />

          {/* Filters */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="px-2">
                <SlidersHorizontalIcon className="h-4 w-4 mr-1" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-60">
              <DropdownMenuLabel>Vendor Filters</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Search By</DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem
                        onClick={() =>
                          updateSearchParams({
                            vendSearchBy: "vendor_name",
                            vendPage: 1,
                          })
                        }
                      >
                        {vendSearchBy === "vendor_name" && (
                          <Check className="h-4 w-4 mr-2" />
                        )}
                        Vendor Name
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          updateSearchParams({
                            vendSearchBy: "id",
                            vendPage: 1,
                          })
                        }
                      >
                        {vendSearchBy === "id" && (
                          <Check className="h-4 w-4 mr-2" />
                        )}
                        Vendor ID
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Sort Order</DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      {["asc", "desc"].map((order) => (
                        <DropdownMenuItem
                          key={order}
                          onClick={() =>
                            updateSearchParams({
                              vendSortOrder: order,
                              vendPage: 1,
                            })
                          }
                        >
                          {vendSortOrder === order && (
                            <Check className="h-4 w-4 mr-2" />
                          )}
                          {order === "asc" ? "Ascending" : "Descending"}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Hint label="Refresh Vendors data">
          <Button
            onClick={async () => {
              try {
                await refetch().unwrap();
              } catch (err) {
                const msg =
                  err?.data?.detail?.msg ??
                  err?.data?.detail ??
                  "Failed to refresh vendors";
                toast.error(msg);
              }
            }}
          >
            <RefreshCcw className={`${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </Hint>
      </div>

      {/* Table */}
      <VendorsTable
        vendors={vendorsList}
        isLoading={isFetchingVendors}
        error={
          vendorsFetchError
            ? vendorsFetchError?.data?.detail ?? "Failed to load vendors"
            : ""
        }
      />

      {/* Pagination */}
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink onClick={() => goToPage(1)}>
              <ChevronFirstIcon className="h-4 w-4" />
            </PaginationLink>
          </PaginationItem>

          <PaginationItem>
            <PaginationLink
              onClick={() => vendPage > 1 && goToPage(vendPage - 1)}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </PaginationLink>
          </PaginationItem>

          <PaginationItem>
            <Select
              value={String(vendPage)}
              onValueChange={(v) => goToPage(Number(v))}
            >
              <SelectTrigger className="w-fit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from(
                  { length: Math.ceil(totalVendors / vendPageSize) },
                  (_, i) => i + 1
                ).map((page) => (
                  <SelectItem key={page} value={String(page)}>
                    Page {page}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </PaginationItem>

          <PaginationItem>
            <PaginationLink
              onClick={() =>
                vendPage < Math.ceil(totalVendors / vendPageSize) &&
                goToPage(vendPage + 1)
              }
            >
              <ChevronRightIcon className="h-4 w-4" />
            </PaginationLink>
          </PaginationItem>

          <PaginationItem>
            <PaginationLink
              onClick={() => goToPage(Math.ceil(totalVendors / vendPageSize))}
            >
              <ChevronLastIcon className="h-4 w-4" />
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default AllVendors;
