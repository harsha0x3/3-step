import React from "react";
import {
  type ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { VendorSpocItem } from "../types";
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
import VendorSpocFormDialog from "./VendorSpocFormDialog";
import { useSelector } from "react-redux";
import { selectAuth } from "@/features/auth/store/authSlice";

type Props = {
  vendorSpocs: VendorSpocItem[];
  isLoading: boolean;
  error: string;
};

const VendorSpocTable: React.FC<Props> = ({
  vendorSpocs,
  isLoading,
  error,
}) => {
  const currentUserInfo = useSelector(selectAuth);
  const columnHelper = createColumnHelper<VendorSpocItem>();

  const columns: ColumnDef<VendorSpocItem, any>[] = [
    columnHelper.accessor("full_name", {
      header: "Full Name",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("contact", {
      header: "Contact",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("vendor.vendor_name", {
      header: "Vendor",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("photo", {
      header: "Photo",
      cell: (info) => {
        const photo = info.getValue();
        if (!photo)
          return <div className="text-muted-foreground">No Photo</div>;
        return (
          <img
            src={`${import.meta.env.VITE_API_BASE_API_URL}${
              import.meta.env.VITE_RELATIVE_API_URL
            }/uploads/${photo}`}
            alt="Vendor Spoc"
            className="w-16 h-16 object-cover rounded border"
          />
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      header:
        currentUserInfo.role === "admin" ||
        currentUserInfo.role === "super_admin"
          ? "Actions"
          : "View Details",
      cell: ({ row }) => {
        const vendorSpoc = row.original;
        if (
          currentUserInfo.role === "admin" ||
          currentUserInfo.role === "super_admin" ||
          currentUserInfo.role === "registration_officer"
        ) {
          return (
            <div className="flex items-center gap-2">
              <VendorSpocFormDialog
                vendorSpoc={vendorSpoc}
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
    data: vendorSpocs,
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
      <div className="rounded-md border">
        <Table className="min-w-full">
          <TableCaption>List of Vendor SPOCs</TableCaption>
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
                  No vendor SPOCs found.
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

export default VendorSpocTable;
