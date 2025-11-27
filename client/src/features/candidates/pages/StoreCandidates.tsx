import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { selectAuth } from "@/features/auth/store/authSlice";
import { useGetCandidatesOfStoreQuery } from "../store/candidatesApiSlice";
import CandidatesTable from "../components/CandidatesTable";
// import CandidateFormDialog from "../components/CandidateFormDialog";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import type { CandidatesSearchParams, PartialCandidateItem } from "../types";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  ArrowBigLeftDashIcon,
  Check,
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import StoreCandidatesTable from "../components/StoreCandidatesTable";

const AllCandidates: React.FC = () => {
  const currentUserInfo = useSelector(selectAuth);
  const [searchParams, setSearchParams] = useSearchParams();
  const candPage = parseInt(searchParams.get("candPage") || "1", 10);
  const candPageSize = parseInt(searchParams.get("candPageSize") || "15", 10);
  const candSortBy = searchParams.get("candSortBy") || "created_at";
  const candSortOrder = searchParams.get("candSortOrder") || "desc";
  const candSearchBy = searchParams.get("candSearchBy") || "full_name";
  const candSearchTerm = searchParams.get("candSearchTerm") || "";
  const candIsVerified = searchParams.get("is_verified");
  const candIsIssued = searchParams.get("is_issued");
  const location = useLocation();
  const navigate = useNavigate();

  const fromDashboardRef = useRef(location.state?.from === "dashboard");
  const fromDashboard = fromDashboardRef.current;

  const [searchInput, setSearchInput] = useState<string>("");

  const candSearchParams: CandidatesSearchParams = useMemo(
    () => ({
      page: candPage ?? 1,
      page_size: candPageSize ?? 15,
      sort_by: candSortBy ?? "created_at",
      sort_order: candSortOrder ?? "desc",
      search_by: candSearchBy ?? "full_name",
      search_term: candSearchTerm,
      is_verified:
        candIsVerified !== null ? candIsVerified === "true" : undefined,
      is_issued: candIsIssued !== null ? candIsIssued === "true" : undefined,
    }),
    [
      candPage,
      candPageSize,
      candSortBy,
      candSortOrder,
      candSearchBy,
      candSearchTerm,
      candIsVerified,
      candIsIssued,
    ]
  );

  const updateSearchParams = (updates: object) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null) newParams.delete(key);
      else newParams.set(key, value);
    });
    setSearchParams(newParams);
    console.log("NEW PARAMS");
  };

  const goToPage = (candPage: number) => {
    console.log("APP PAGE RECIEVED TO GOT FUNC", candPage);
    updateSearchParams({ candPage: candPage });
  };

  const {
    data: candidatesData,
    isLoading: isFetchingCandidates,
    error: candidatesFetchError,
  } = useGetCandidatesOfStoreQuery(candSearchParams, {
    skip: currentUserInfo.role !== "store_agent",
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    console.log("❌❌❌❌CANDIDATES FRTCH ERR", candidatesFetchError);
  }, [candidatesFetchError]);

  useEffect(() => {
    const handler = setTimeout(() => {
      updateSearchParams({ candSearchTerm: searchInput });
    }, 500); // adjust debounce delay (ms)

    return () => {
      clearTimeout(handler);
    };
  }, [searchInput]);

  useEffect(() => {
    console.log("The Search params", candSearchParams);
  }, [candSearchParams]);

  const candidatesDataList =
    candidatesData?.data?.candidates ?? ([] as PartialCandidateItem[]);
  console.log("CANDIDATES DATA LIST", candidatesDataList);
  console.log("CANDIDATES DATA", candidatesData);

  const totalCandidates = candidatesData?.data?.total_count ?? 0;

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
        <div className="flex justify-between items-center">
          <div className="w-full space-y-2 flex flex-wrap items-center">
            {/* Search Text Input */}
            <div className="px-2 flex items-center gap-2">
              <Label className="font-medium">Search: </Label>
              <Input
                value={searchInput}
                placeholder={`Search Employee by ${
                  candSearchBy === "id" ? "Employee ID" : "Full Name"
                }`}
                onChange={(e) => setSearchInput(e.target.value)}
                className="mt-1 h-8"
              />
            </div>
            {/* Filters Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="px-2">
                  <SlidersHorizontalIcon className="h-4 w-4 mr-2" /> Filters
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-60">
                <DropdownMenuLabel>Candidate Filters</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  {/* Search By */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Search By</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem
                          onClick={() =>
                            updateSearchParams({
                              candSearchBy: "full_name",
                              candPage: 1,
                            })
                          }
                        >
                          {candSearchBy === "full_name" && (
                            <Check className="h-4 w-4 mr-2" />
                          )}
                          Full Name
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            updateSearchParams({
                              candSearchBy: "id",
                              candPage: 1,
                            })
                          }
                        >
                          {candSearchBy === "id" && (
                            <Check className="h-4 w-4 mr-2" />
                          )}
                          Employee ID
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>

                  {/* Sort Order */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Sort Order</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem
                          onClick={() =>
                            updateSearchParams({
                              candSortOrder: "asc",
                              candPage: 1,
                            })
                          }
                        >
                          {candSortOrder === "asc" && (
                            <Check className="h-4 w-4 mr-2" />
                          )}
                          Ascending
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            updateSearchParams({
                              candSortOrder: "desc",
                              candPage: 1,
                            })
                          }
                        >
                          {candSortOrder === "desc" && (
                            <Check className="h-4 w-4 mr-2" />
                          )}
                          Descending
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>

                  {/* Sort By */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Sort By</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem
                          onClick={() =>
                            updateSearchParams({
                              candSortBy: "created_at",
                              candPage: 1,
                            })
                          }
                        >
                          {candSortBy === "created_at" && (
                            <Check className="h-4 w-4 mr-2" />
                          )}
                          Date Created
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            updateSearchParams({
                              candSortBy: "full_name",
                              candPage: 1,
                            })
                          }
                        >
                          {candSortBy === "full_name" && (
                            <Check className="h-4 w-4 mr-2" />
                          )}
                          Full Name
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            updateSearchParams({
                              candSortBy: "id",
                              candPage: 1,
                            })
                          }
                        >
                          {candSortBy === "id" && (
                            <Check className="h-4 w-4 mr-2" />
                          )}
                          Employee ID
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>

                  {/* Verification Filter */}
                  {currentUserInfo.role !== "store_agent" && (
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        Voucher Issuance
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem
                            onClick={() =>
                              updateSearchParams({
                                is_verified: null,
                                candPage: 1,
                              })
                            }
                          >
                            {candIsVerified === null && (
                              <Check className="h-4 w-4 mr-2" />
                            )}
                            All
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              updateSearchParams({
                                is_verified: "true",
                                candPage: 1,
                              })
                            }
                          >
                            {candIsVerified === "true" && (
                              <Check className="h-4 w-4 mr-2" />
                            )}
                            Issued
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              updateSearchParams({
                                is_verified: "false",
                                candPage: 1,
                              })
                            }
                          >
                            {candIsVerified === "false" && (
                              <Check className="h-4 w-4 mr-2" />
                            )}
                            Not Issued
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                  )}
                  {/* Issued Filter */}

                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      Laptop Issuance Status
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem
                          onClick={() =>
                            updateSearchParams({
                              is_issued: null,
                              candPage: 1,
                            })
                          }
                        >
                          {candIsIssued === null && (
                            <Check className="h-4 w-4 mr-2" />
                          )}
                          All
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            updateSearchParams({
                              is_issued: "true",
                              candPage: 1,
                            })
                          }
                        >
                          {candIsIssued === "true" && (
                            <Check className="h-4 w-4 mr-2" />
                          )}
                          Issued
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            updateSearchParams({
                              is_issued: "false",
                              candPage: 1,
                            })
                          }
                        >
                          {candIsIssued === "false" && (
                            <Check className="h-4 w-4 mr-2" />
                          )}
                          Not Issued
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* {(currentUserInfo.role === "admin" ||
            currentUserInfo.role === "super_admin") && <CandidateFormDialog />} */}
        </div>
        <div className="flex gap-3 items-center">
          <p className="">Total Beneticiaries: {totalCandidates}</p>
          <p>|</p>
          <p>
            Page {candPage} of {Math.ceil(totalCandidates / candPageSize)}
          </p>
        </div>
      </div>

      <div className="flex-1">
        <StoreCandidatesTable
          candidates={candidatesDataList}
          isLoading={isFetchingCandidates}
          error={
            candidatesFetchError
              ? candidatesFetchError?.data?.detail ??
                "An Error Occured while fetching beneficiaries"
              : ""
          }
        />
      </div>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink
              aria-label="Go to first page"
              size="icon"
              className="rounded-full"
              onClick={() => goToPage(1)}
            >
              <ChevronFirstIcon className="h-4 w-4" />
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              aria-label="Go to previous page"
              size="icon"
              className="rounded-full"
              onClick={() => {
                if (candPage <= 1) {
                  console.log("REturning from going to previous", candPage);
                  return;
                }
                goToPage(candPage - 1);
              }}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <Select
              value={String(candPage)}
              aria-label="Select page"
              onValueChange={(value) => goToPage(Number(value))}
            >
              <SelectTrigger
                id="select-page"
                className="w-fit whitespace-nowrap"
                aria-label="Select page"
              >
                <SelectValue placeholder="Select page" />
              </SelectTrigger>
              <SelectContent>
                {Array.from(
                  { length: Math.ceil(totalCandidates / candPageSize) },
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
              onClick={() => {
                if (candPage === Math.ceil(totalCandidates / candPageSize))
                  return;
                console.log("Goint to next page");
                goToPage(candPage + 1);
              }}
              aria-label="Go to next page"
              size="icon"
              className="rounded-full"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              onClick={() =>
                goToPage(Math.ceil(totalCandidates / candPageSize))
              }
              aria-label="Go to last page"
              size="icon"
              className="rounded-full"
            >
              <ChevronLastIcon className="h-4 w-4" />
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default AllCandidates;
