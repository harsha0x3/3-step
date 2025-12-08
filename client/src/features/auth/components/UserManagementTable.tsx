import React from "react";
import {
  type ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, RefreshCw, MapPin } from "lucide-react";
import {
  useDeleteUserMutation,
  useResetUserPasswordMutation,
} from "../store/usersApiSlice";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Hint from "@/components/ui/hint";
import type { User, UserItem } from "../types";

type Props = {
  users: UserItem[];
  onEdit: (user: User) => void;
};

const UserManagementTable: React.FC<Props> = ({ users, onEdit }) => {
  const [deleteUser] = useDeleteUserMutation();
  const [resetPassword] = useResetUserPasswordMutation();

  const handleDelete = async (userId: string) => {
    try {
      await deleteUser(userId).unwrap();
      toast.success("User deactivated successfully");
    } catch (error: any) {
      toast.error(error?.data?.detail || "Failed to deactivate user");
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      const result = await resetPassword(userId).unwrap();
      toast.success(`Password reset to: ${result.data.default_password}`, {
        duration: 10000,
      });
    } catch (error: any) {
      toast.error(error?.data?.detail || "Failed to reset password");
    }
  };

  const columnHelper = createColumnHelper<User>();

  const columns: ColumnDef<User, any>[] = [
    columnHelper.accessor("mobile_number", {
      header: "Mobile Number",
      cell: (info) => info.getValue(),
    }),
    // columnHelper.accessor("email", {
    //   header: "Email",
    //   cell: (info) => info.getValue(),
    // }),
    columnHelper.accessor("full_name", {
      header: "Full Name",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("role", {
      header: "Role & Location",
      cell: ({ row, getValue }) => {
        const role = getValue();
        const location = row.original.location;
        return (
          <div>
            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
              {role}
            </span>
            {["registration_officer"].includes(role) && (
              <span className="flex pt-1 gap-2 items-center text-muted-foreground text-xs">
                <MapPin className="w-3 h-3" />
                {location}
              </span>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor("is_active", {
      header: "Status",
      cell: (info) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            info.getValue()
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {info.getValue() ? "Active" : "Inactive"}
        </span>
      ),
    }),
    columnHelper.accessor("must_change_password", {
      header: "Password Status",
      cell: (info) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            info.getValue()
              ? "bg-yellow-100 text-yellow-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {info.getValue() ? "Must Change" : "OK"}
        </span>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Hint label="Edit User Info">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(row.original)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </Hint>

          <AlertDialog>
            <Hint label="Reset User's password to default Password@123">
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
            </Hint>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset Password?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reset the user's password to "password@123". The
                  user will be required to change it on next login.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleResetPassword(row.original.id!)}
                >
                  Reset Password
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <Hint label="Deactivate User">
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </AlertDialogTrigger>
            </Hint>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Deactivate User?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will deactivate the user account. They won't be able to
                  log in.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete(row.original.id!)}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Deactivate
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="w-full rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UserManagementTable;
