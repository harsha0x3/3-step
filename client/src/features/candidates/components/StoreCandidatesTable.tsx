import React from "react";
import {
  type ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { PartialCandidateItem } from "../types";
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
import IssuanceDetailsDialog from "./IssuanceDetailsDialog";

type Props = {
  candidates: PartialCandidateItem[];
  isLoading: boolean;
  error: string;
};

const StoreCandidatesTable: React.FC<Props> = ({
  candidates,
  isLoading,
  error,
}) => {
  const columnHelper = createColumnHelper<PartialCandidateItem>();
  console.log("PARTIAL CANDIDATEs", candidates);

  const columns: ColumnDef<PartialCandidateItem, any>[] = [
    columnHelper.accessor("id", {
      header: "Employee ID",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("full_name", {
      header: "Full Name",
      cell: (info) => info.getValue(),
    }),

    columnHelper.accessor("mobile_number", {
      header: "Mobile",
      cell: (info) => info.getValue(),
    }),

    // columnHelper.accessor("is_candidate_verified", {
    //   header: "Voucher Issue Status",
    //   cell: (info) => {
    //     const verified = info.getValue();

    //     return (
    //       <div className="flex flex-col">
    //         <span className={``}>
    //           {verified ? (
    //             <>
    //               <span
    //                 className={`px-2 py-1 rounded text-xs font-medium hover:cursor-default ${
    //                   verified ? "bg-green-300/50 text-green-600" : ""
    //                 }`}
    //               >
    //                 Issued
    //               </span>
    //             </>
    //           ) : (
    //             <span
    //               className={`px-2 py-1 rounded text-xs font-medium ${
    //                 verified ? "" : "bg-red-300/50 text-red-600"
    //               }`}
    //             >
    //               Not Issued
    //             </span>
    //           )}
    //         </span>
    //       </div>
    //     );
    //   },
    // }),

    columnHelper.accessor("issued_status", {
      header: "Laptop Issue Status",
      cell: ({ row, getValue }) => {
        const status = getValue();
        return (
          <div className="flex items-center justify-center">
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                status === "issued"
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {status === "issued" ? "Issued" : "Not Issued"}
            </span>
            {status === "issued" && (
              <div>
                <p>{JSON.stringify(row.original.id)}</p>
                <IssuanceDetailsDialog candidateId={row.original.id} />
              </div>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor("store", {
      header: "Store Info",
      cell: (info) => {
        const store = info.getValue();
        if (!store) return "-";
        return (
          <div className="flex flex-col">
            <span className="font-medium">Name: {store.name}</span>
            <span className="text-xs text-muted-foreground">
              City: {store.city}
            </span>
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: candidates,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return <Loader className="animate-spin h-10 w-10" />;
  }

  if (error) {
    return (
      <div>
        {error?.data?.detail?.msg ??
          error?.data?.detail ??
          "Error Getting Beneficiary details"}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="rounded-md border">
        <Table className="min-w-full">
          <TableCaption>List of Beneficiary Employees</TableCaption>
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
                  No data found.
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

export default StoreCandidatesTable;
