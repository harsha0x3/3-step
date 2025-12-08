import React, { useState } from "react";
import { useGetAllUsersQuery } from "../store/usersApiSlice";
import UserManagementTable from "../components/UserManagementTable";
import UserFormDialog from "../components/UserFormDialog";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { useSelector } from "react-redux";
import { selectAuth } from "@/features/auth/store/authSlice";

const PAGE_SIZE = 20;

const UserManagement: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const currentUser = useSelector(selectAuth);

  const { data, isLoading, isFetching } = useGetAllUsersQuery({
    page,
    page_size: PAGE_SIZE,
    search,
    sort_by: "created_at",
    sort_order: "asc",
  });

  if (currentUser.role !== "admin" && currentUser.role !== "super_admin") {
    return <div>Access Denied</div>;
  }

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setDialogOpen(true);
  };

  if (isLoading) {
    return <div>Loading users...</div>;
  }

  const users = data?.data?.users || [];
  const totalUsers = data?.data?.total || 0;
  const totalPages = Math.ceil(totalUsers / PAGE_SIZE);

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Button onClick={handleCreate}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <UserManagementTable users={users} onEdit={handleEdit} />

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            disabled={page === 1 || isFetching}
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          >
            Previous
          </Button>
          <span className="flex items-center gap-2">
            Page {page} of {totalPages}
          </span>
          <Button
            disabled={page === totalPages || isFetching}
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          >
            Next
          </Button>
        </div>
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
