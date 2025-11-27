import React, { useState } from "react";
import { useGetAllUsersQuery } from "../store/usersApiSlice";
import UserManagementTable from "../components/UserManagementTable";
import UserFormDialog from "../components/UserFormDialog";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { useSelector } from "react-redux";
import { selectAuth } from "@/features/auth/store/authSlice";

const UserManagement: React.FC = () => {
  const { data, isLoading } = useGetAllUsersQuery(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const currentUser = useSelector(selectAuth);

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
