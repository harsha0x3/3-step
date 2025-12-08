import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { selectAuth } from "@/features/auth/store/authSlice";
import { useGetAllVendorSpocQuery } from "../store/vendorsApiSlice";
import VendorSpocTable from "../components/VendorSpocTable";
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
import type { VendorSpocSearchParams, VendorSpocItem } from "../types";

const AllVendorSpoc: React.FC = () => {
  const currentUserInfo = useSelector(selectAuth);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const fromDashboardRef = useRef(location.state?.from === "dashboard");
  const fromDashboard = fromDashboardRef.current;

  // URL params
  const spocPage = parseInt(searchParams.get("spocPage") || "1", 10);
  const spocPageSize = parseInt(searchParams.get("spocPageSize") || "15", 10);
  const spocSortBy = searchParams.get("spocSortBy") || "created_at";
  const spocSortOrder = searchParams.get("spocSortOrder") || "desc";
  const spocSearchBy = searchParams.get("spocSearchBy") || "full_name";
  const spocSearchTerm = searchParams.get("spocSearchTerm") || "";
  const spocVendorId = searchParams.get("spocVendorId") || "";

  const [searchInput, setSearchInput] = useState("");

  const spocSearchParams: VendorSpocSearchParams = useMemo(
    () => ({
      page: spocPage,
      page_size: spocPageSize,
      sort_by: spocSortBy,
      sort_order: spocSortOrder,
      search_by: spocSearchBy,
      search_term: spocSearchTerm,
      vendor_id: spocVendorId || undefined,
    }),
    [
      spocPage,
      spocPageSize,
      spocSortBy,
      spocSortOrder,
      spocSearchBy,
      spocSearchTerm,
      spocVendorId,
    ]
  );

  const {
    data: vendorSpocData,
    isLoading: isFetchingVendorSpocs,
    error: vendorSpocError,
    refetch,
    isFetching,
  } = useGetAllVendorSpocQuery(spocSearchParams, {
    skip:
      currentUserInfo.role !== "admin" &&
      currentUserInfo.role !== "super_admin" &&
      currentUserInfo.role !== "registration_officer",
    refetchOnMountOrArgChange: true,
  });

  const totalSpocs = vendorSpocData?.data?.total_count ?? 0;
  const vendorSpocList =
    vendorSpocData?.data?.vendor_spocs ?? ([] as VendorSpocItem[]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      updateSearchParams({
        spocSearchTerm: searchInput,
        spocPage: 1,
      });
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const updateSearchParams = (updates: object) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "")
        newParams.delete(key);
      else newParams.set(key, String(value));
    });
    setSearchParams(newParams);
  };

  const goToPage = (page: number) => {
    updateSearchParams({ spocPage: page });
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

      {/* Filters + Search */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <Label>Search:</Label>
          <Input
            value={searchInput}
            placeholder="Search Vendor SPOC"
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-8"
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="px-2">
                <SlidersHorizontalIcon className="h-4 w-4 mr-1" />
                Filters
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-64">
              <DropdownMenuLabel>SPOC Filters</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {/* Search By */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Search By</DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      {[
                        { key: "full_name", label: "Full Name" },
                        { key: "email", label: "Email" },
                        { key: "mobile_number", label: "Mobile" },
                        { key: "vendor_name", label: "Vendor Name" },
                      ].map((item) => (
                        <DropdownMenuItem
                          key={item.key}
                          onClick={() =>
                            updateSearchParams({
                              spocSearchBy: item.key,
                              spocPage: 1,
                            })
                          }
                        >
                          {spocSearchBy === item.key && (
                            <Check className="h-4 w-4 mr-2" />
                          )}
                          {item.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                {/* Sort Order */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Sort Order</DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      {["asc", "desc"].map((order) => (
                        <DropdownMenuItem
                          key={order}
                          onClick={() =>
                            updateSearchParams({
                              spocSortOrder: order,
                              spocPage: 1,
                            })
                          }
                        >
                          {spocSortOrder === order && (
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

        {/* Refresh */}
        <Hint label="Refresh Vendor SPOCs data">
          <Button
            onClick={async () => {
              try {
                await refetch().unwrap();
              } catch (err) {
                const msg =
                  err?.data?.detail?.msg ??
                  err?.data?.detail ??
                  "Failed to refresh vendor spocs";
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
      <VendorSpocTable
        vendorSpocs={vendorSpocList}
        isLoading={isFetchingVendorSpocs}
        error={
          vendorSpocError
            ? vendorSpocError?.data?.detail ?? "Failed to fetch vendor spocs"
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
              onClick={() => spocPage > 1 && goToPage(spocPage - 1)}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </PaginationLink>
          </PaginationItem>

          <PaginationItem>
            <Select
              value={String(spocPage)}
              onValueChange={(v) => goToPage(Number(v))}
            >
              <SelectTrigger className="w-fit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from(
                  { length: Math.ceil(totalSpocs / spocPageSize) },
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
                spocPage < Math.ceil(totalSpocs / spocPageSize) &&
                goToPage(spocPage + 1)
              }
            >
              <ChevronRightIcon className="h-4 w-4" />
            </PaginationLink>
          </PaginationItem>

          <PaginationItem>
            <PaginationLink
              onClick={() => goToPage(Math.ceil(totalSpocs / spocPageSize))}
            >
              <ChevronLastIcon className="h-4 w-4" />
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default AllVendorSpoc;
