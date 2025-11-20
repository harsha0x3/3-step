import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { selectAuth } from "@/features/auth/store/authSlice";
import { useGetAllCandidatesQuery } from "../store/candidatesApiSlice";
import CandidatesTable from "../components/CandidatesTable";
import CandidateFormDialog from "../components/CandidateFormDialog";
import { useSearchParams } from "react-router-dom";
import type { CandidateItemWithStore, CandidatesSearchParams } from "../types";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const AllCandidates: React.FC = () => {
  const currentUserInfo = useSelector(selectAuth);
  const [searchParams, setSearchParams] = useSearchParams();
  const candPage = parseInt(searchParams.get("candPage") || "1", 10);
  const candPageSize = parseInt(searchParams.get("candPageSize") || "15", 10);
  const candSortBy = searchParams.get("candSortBy") || "created_at";
  const candSortOrder = searchParams.get("candSortOrder") || "desc";
  const candSearchBy = searchParams.get("candSearchBy") || "full_name";
  const candSearchTerm = searchParams.get("candSearchTerm") || "";

  const [searchInput, setSearchInput] = useState<string>("");

  const candSearchParams: CandidatesSearchParams = useMemo(
    () => ({
      page: candPage ?? 1,
      page_size: candPageSize ?? 15,
      sort_by: candSortBy ?? "created_at",
      sort_order: candSortOrder ?? "desc",
      search_by: candSearchBy ?? "full_name",
      search_term: candSearchTerm,
    }),
    [
      candPage,
      candPageSize,
      candSortBy,
      candSortOrder,
      candSearchBy,
      candSearchTerm,
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
  } = useGetAllCandidatesQuery(candSearchParams, {
    skip:
      currentUserInfo.role !== "admin" &&
      currentUserInfo.role !== "super_admin" &&
      currentUserInfo.role !== "registration_officer",
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
    candidatesData?.data?.candidates ?? ([] as CandidateItemWithStore[]);

  if (currentUserInfo.role === "store_agent") {
    return null;
  }
  const totalCandidates = candidatesData?.data?.total_count ?? 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <div className="w-full max-w-xs space-y-2">
          <div className="flex flex-col md:flex-row rounded-md">
            <Input
              type="text"
              placeholder={`Search candidate by`}
              value={searchInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setSearchInput(e.target.value);
              }}
            />
            <Select
              value={String(candSearchBy)}
              aria-label="Select page"
              onValueChange={(value) =>
                updateSearchParams({ candSearchBy: value })
              }
            >
              <SelectTrigger
                id="select-page"
                className="whitespace-nowrap w-32"
                aria-label="Select page"
              >
                <SelectValue placeholder="Search by" />
              </SelectTrigger>
              <SelectContent className="">
                <SelectItem value="full_name">Full Name</SelectItem>
                <SelectItem value="id">Employee Id</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <CandidateFormDialog />
      </div>
      <div className="flex-1">
        <CandidatesTable
          candidates={candidatesDataList}
          isLoading={isFetchingCandidates}
          error={
            candidatesFetchError
              ? candidatesFetchError?.data?.detail ??
                "An Error Occured while fetching candidates"
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
