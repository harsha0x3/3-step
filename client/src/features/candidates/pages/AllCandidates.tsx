import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { selectAuth } from "@/features/auth/store/authSlice";
import { useGetAllUsersQuery } from "../store/usersApiSlice";
import UserManagementTable from "../components/UserManagementTable";
import UserFormDialog from "../components/UserFormDialog";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const PAGE_SIZE_DEFAULT = 15;

const UserManagement: React.FC = () => {
  const currentUser = useSelector(selectAuth);
  const [searchParams, setSearchParams] = useSearchParams();

  // Read search params from URL
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(
    searchParams.get("pageSize") || PAGE_SIZE_DEFAULT.toString(),
    10
  );
  const searchBy = searchParams.get("searchBy") || "full_name";
  const searchTerm = searchParams.get("searchTerm") || "";

  const [searchInput, setSearchInput] = useState(searchTerm);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Debounced search update
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchParams({
        ...Object.fromEntries(searchParams.entries()),
        searchTerm: searchInput,
        page: "1", // reset to first page on search
      });
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Memoized query params
  const userQueryParams = useMemo(
    () => ({
      page: -1,
      page_size: pageSize,
      search_by: searchBy,
      search_term: searchTerm,
    }),
    [page, pageSize, searchBy, searchTerm]
  );

  const { data, isLoading, isFetching, refetch, error } = useGetAllUsersQuery(
    userQueryParams,
    {
      refetchOnMountOrArgChange: true,
    }
  );

  if (!["admin", "super_admin"].includes(currentUser.role)) {
    return <div>Access Denied</div>;
  }

  const users = data?.data?.users || [];
  const totalUsers = data?.data?.total || 0;
  const totalPages = Math.ceil(totalUsers / pageSize);

  const goToPage = (newPage: number) => {
    setSearchParams({
      ...Object.fromEntries(searchParams.entries()),
      page: String(newPage),
    });
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setDialogOpen(true);
  };

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-2xl font-bold">User Management</h1>

        <div className="flex items-center gap-2 flex-wrap">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={`Search by ${searchBy}`}
            className="h-8"
          />
          <Button onClick={handleCreate}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div>Loading users...</div>
      ) : (
        <>
          <UserManagementTable users={users} onEdit={handleEdit} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                disabled={page === 1 || isFetching}
                onClick={() => goToPage(1)}
              >
                First
              </Button>
              <Button
                disabled={page === 1 || isFetching}
                onClick={() => goToPage(page - 1)}
              >
                Previous
              </Button>
              <span>
                Page {page} of {totalPages}
              </span>
              <Button
                disabled={page === totalPages || isFetching}
                onClick={() => goToPage(page + 1)}
              >
                Next
              </Button>
              <Button
                disabled={page === totalPages || isFetching}
                onClick={() => goToPage(totalPages)}
              >
                Last
              </Button>
            </div>
          )}
        </>
      )}

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
