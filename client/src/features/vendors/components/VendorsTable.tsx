import React from "react";
import {
  type ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { VendorItem } from "../types";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader } from "lucide-react";
import VendorFormDialog from "./VendorFormDialog";
import { useSelector } from "react-redux";
import { selectAuth } from "@/features/auth/store/authSlice";

type Props = {
  vendors: VendorItem[];
  isLoading: boolean;
  error: string;
};

const VendorsTable: React.FC<Props> = ({ vendors, isLoading, error }) => {
  const currentUserInfo = useSelector(selectAuth);
  const columnHelper = createColumnHelper<VendorItem>();

  const columns: ColumnDef<VendorItem, any>[] = [
    columnHelper.accessor("vendor_name", {
      header: "Vendor Name",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("location", {
      header: "Location",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("mobile_number", {
      header: "Mobile Number",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("email", {
      header: "E-Mail",
      cell: (info) => info.getValue(),
    }),

    columnHelper.display({
      id: "actions",
      header:
        currentUserInfo.role === "admin" ||
        currentUserInfo.role === "super_admin"
          ? "Actions"
          : "View Details",
      cell: ({ row }) => {
        const vendor = row.original;
        if (
          currentUserInfo.role === "admin" ||
          currentUserInfo.role === "super_admin" ||
          currentUserInfo.role === "registration_officer"
        ) {
          return (
            <div className="flex items-center gap-2">
              <VendorFormDialog
                vendor={vendor}
                viewOnly={currentUserInfo.role === "registration_officer"}
              />
            </div>
          );
        }
        return null;
      },
    }),
  ];

  const table = useReactTable({
    data: vendors,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (
    currentUserInfo.role !== "admin" &&
    currentUserInfo.role !== "super_admin" &&
    currentUserInfo.role !== "registration_officer"
  ) {
    return <div>You do not have permission to view this content.</div>;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader className="animate-spin h-10 w-10" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="w-full">
      <div className="flex justify-between">
        <div />
        <p>Total Vendors: {vendors.length}</p>
      </div>
      <div className="rounded-md border">
        <Table className="min-w-full">
          <TableCaption>List of Vendors</TableCaption>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="sticky top-0 z-20 bg-background"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-6"
                >
                  No vendors found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default VendorsTable;
