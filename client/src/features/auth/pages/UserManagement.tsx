import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { selectAuth } from "@/features/auth/store/authSlice";
import { useGetAllUsersQuery } from "../store/usersApiSlice";
import UserManagementTable from "../components/UserManagementTable";
import UserFormDialog from "../components/UserFormDialog";
import SingleRegionCombobox from "@/features/regions/components/SingleRegionCombobox";
import { Button } from "@/components/ui/button";
import {
  UserPlus,
  RefreshCcw,
  Check,
  SlidersHorizontalIcon,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "react-router-dom";
import type { RegionOut } from "@/store/rootTypes";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEFAULT_PAGE_SIZE = 20;

const UserManagement: React.FC = () => {
  const currentUser = useSelector(selectAuth);
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get("userPage") || "1", 10);
  const pageSize = parseInt(
    searchParams.get("userPageSize") || DEFAULT_PAGE_SIZE.toString(),
    10
  );
  const sortBy = searchParams.get("userSortBy") || "created_at";
  const sortOrder = searchParams.get("userSortOrder") || "desc";
  const searchTerm = searchParams.get("userSearchTerm") || "";
  const searchBy = searchParams.get("userSearchBy") || "full_name";
  const regionId = searchParams.get("userRegionId");

  const [searchInput, setSearchInput] = useState(searchTerm);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const queryParams = useMemo(
    () => ({
      page,
      page_size: pageSize,
      search: searchTerm,
      sort_by: sortBy,
      sort_order: sortOrder,
      search_by: searchBy,
      region_id: regionId || undefined,
    }),
    [page, pageSize, searchTerm, sortBy, sortOrder, searchBy, regionId]
  );

  const { data, isLoading, isFetching, refetch } = useGetAllUsersQuery(
    queryParams,
    {
      refetchOnMountOrArgChange: true,
    }
  );

  useEffect(() => {
    const t = setTimeout(() => {
      updateSearchParams({ userSearchTerm: searchInput, userPage: 1 });
    }, 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  if (!["admin", "super_admin"].includes(currentUser.role)) {
    return <div>Access Denied</div>;
  }

  const users = data?.data?.users ?? [];
  const totalUsers = data?.data?.count ?? 0;
  const totalPages = Math.ceil(totalUsers / pageSize);

  // ✅ Helpers
  const updateSearchParams = (
    updates: Record<string, string | number | null>
  ) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === undefined) next.delete(k);
      else next.set(k, String(v));
    });
    setSearchParams(next);
  };

  const goToPage = (p: number) => {
    updateSearchParams({ userPage: p });
  };

  // ✅ Debounced search sync

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex justify-between items-center"></div>

      {/* Search + Filters */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center flex-1">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search users..."
            className="h-8 max-w-xs"
          />

          <SingleRegionCombobox
            value={regionId || undefined}
            onChange={(region) => {
              updateSearchParams({
                userRegionId: region.id,
                userPage: 1,
              });
            }}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="px-2">
                <SlidersHorizontalIcon className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent>
              <DropdownMenuGroup>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Sort By</DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      {[
                        { field: "created_at", label: "Created At" },
                        { field: "full_name", label: "Full Name" },
                      ].map((item) => (
                        <DropdownMenuItem
                          key={item.field}
                          onClick={() =>
                            updateSearchParams({
                              userSortBy: item.field,
                              userPage: 1,
                            })
                          }
                        >
                          {sortBy === item.field && (
                            <Check className="h-4 w-4 mr-2" />
                          )}
                          {item.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSeparator />

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Sort Order</DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      {["asc", "desc"].map((ord) => (
                        <DropdownMenuItem
                          key={ord}
                          onClick={() =>
                            updateSearchParams({
                              userSortOrder: ord,
                              userPage: 1,
                            })
                          }
                        >
                          {sortOrder === ord && (
                            <Check className="h-4 w-4 mr-2" />
                          )}
                          {ord.toUpperCase()}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSeparator />

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Search By</DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem
                        onClick={() =>
                          updateSearchParams({
                            userSearchBy: "full_name",
                          })
                        }
                      >
                        {searchBy === "full_name" && (
                          <Check className="h-4 w-4 mr-2" />
                        )}
                        Full Name
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          updateSearchParams({
                            userSearchBy: "mobile_number",
                          })
                        }
                      >
                        {searchBy === "mobile_number" && (
                          <Check className="h-4 w-4 mr-2" />
                        )}
                        Mobile Number
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => refetch()}>
            <RefreshCcw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Table */}
      <UserManagementTable
        users={users}
        onEdit={(user) => {
          setSelectedUser(user);
          setDialogOpen(true);
        }}
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
            <PaginationLink onClick={() => page > 1 && goToPage(page - 1)}>
              <ChevronLeftIcon className="h-4 w-4" />
            </PaginationLink>
          </PaginationItem>

          <PaginationItem>
            <Select
              value={String(page)}
              onValueChange={(v) => goToPage(Number(v))}
            >
              <SelectTrigger className="w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <SelectItem key={p} value={String(p)}>
                      Page {p}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </PaginationItem>

          <PaginationItem>
            <PaginationLink
              onClick={() => page < totalPages && goToPage(page + 1)}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </PaginationLink>
          </PaginationItem>

          <PaginationItem>
            <PaginationLink onClick={() => goToPage(totalPages)}>
              <ChevronLastIcon className="h-4 w-4" />
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      {/* Dialog */}
      <UserFormDialog
        user={selectedUser}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedUser(null);
        }}
      />
    </div>
  );
};

export default UserManagement;
