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
import { EyeIcon, Loader } from "lucide-react";
import VendorFormDialog from "./VendorFormDialog";
import { useSelector } from "react-redux";
import { selectAuth } from "@/features/auth/store/authSlice";
import { Button } from "@/components/ui/button";

type Props = {
  vendors: VendorItem[];
  isLoading: boolean;
  error: string;
};

const VendorsTable: React.FC<Props> = ({ vendors, isLoading, error }) => {
  const currentUserInfo = useSelector(selectAuth);
  const columnHelper = createColumnHelper<VendorItem>();
  const [openEdit, setOpenEdit] = React.useState(false);
  const [selectedVendor, setSelectedVendor] = React.useState<VendorItem | null>(
    null
  );

  const columns: ColumnDef<VendorItem, any>[] = [
    columnHelper.accessor("vendor_name", {
      header: "Vendor Name",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("vendor_owner", {
      header: "Owner Name",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("mobile_number", {
      header: "Owner Mobile Number",
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
              <Button
                variant={"outline"}
                onClick={() => {
                  setOpenEdit(true);
                  setSelectedVendor(vendor);
                }}
              >
                <EyeIcon />
              </Button>
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
      {selectedVendor && (
        <VendorFormDialog
          vendor={selectedVendor}
          defOpen={openEdit}
          onOpenChange={() => setOpenEdit(false)}
          viewOnly={currentUserInfo.role === "registration_officer"}
        />
      )}
      <div className="rounded-md border max-h-[480px] overflow-y-auto relative">
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
