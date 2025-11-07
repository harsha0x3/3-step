import React from "react";
import {
  type ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { CandidateItemWithStore } from "../types";
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
import CandidateFormDialog from "./CandidateFormDialog";
import { useSelector } from "react-redux";
import { selectAuth } from "@/features/auth/store/authSlice";
import CouponDialog from "@/features/verification/components/CouponDialog";

type Props = {
  candidates: CandidateItemWithStore[];
  isLoading: boolean;
  error: string;
};

const CandidatesTable: React.FC<Props> = ({ candidates, isLoading, error }) => {
  const currentUserInfo = useSelector(selectAuth);

  const columnHelper = createColumnHelper<CandidateItemWithStore>();

  const columns: ColumnDef<CandidateItemWithStore, any>[] = [
    columnHelper.accessor("id", {
      header: "Candidate ID",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("full_name", {
      header: "Full Name",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("gender", {
      header: "Gender",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("mobile_number", {
      header: "Mobile",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("email", {
      header: "Email",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("parent_employee_code", {
      header: "Parent Employee Code",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("parent_name", {
      header: "Parent Name",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("is_candidate_verified", {
      header: "Is Verified",
      cell: (info) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            info.getValue()
              ? "bg-green-300/50 text-green-600"
              : "bg-red-300/50 text-red-600"
          }`}
        >
          {info.getValue() ? "Verified" : "Not Verified"}
        </span>
      ),
    }),
    columnHelper.accessor("issued_status", {
      header: "Issued Status",
      cell: (info) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            info.getValue() === "issued"
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("store_with_user", {
      header: "Store Info",
      cell: (info) => {
        const store = info.getValue();
        if (!store) return "-";
        return (
          <div className="flex flex-col">
            <span className="font-medium">{store.store_name}</span>
            <span className="text-xs text-muted-foreground">
              {store.store_person?.email}
            </span>
          </div>
        );
      },
    }),
    columnHelper.display({
      id: "verify-candidate",
      header:
        currentUserInfo.role === "admin" ? "View details" : "Verify Details",
      cell: ({ row }) => {
        const candidate = row.original;
        if (
          currentUserInfo.role === "admin" ||
          currentUserInfo.role === "verifier"
        ) {
          return (
            <div className="flex items-center gap-2">
              <CandidateFormDialog
                candidate={candidate}
                store_id={candidate.store_id}
                viewOnly={currentUserInfo.role === "verifier"}
                toVerify={currentUserInfo.role === "verifier"}
              />
            </div>
          );
        } else {
          return null;
        }
      },
    }),
    columnHelper.accessor("coupon", {
      id: "coupon",
      header: "Coupon",
      cell: ({ row }) => {
        const coupon = row.original.coupon;
        return coupon ? (
          <span className="font-medium">{coupon}</span>
        ) : (
          <span className="text-muted-foreground">No Coupon</span>
        );
      },
    }),
  ];

  if (currentUserInfo.role === "verifier") {
    columns.push(
      columnHelper.display({
        id: "add-coupon",
        header: "Add coupon",
        cell: ({ row }) => {
          const candidate = row.original;
          return (
            <div className="flex items-center gap-2">
              <CouponDialog candidateId={candidate.id} />
            </div>
          );
        },
      })
    );
  }

  const table = useReactTable({
    data: candidates,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (currentUserInfo.role !== "admin" && currentUserInfo.role !== "verifier") {
    console.log(currentUserInfo);
    return <div>You do not have permission to view this content.</div>;
  }
  if (isLoading) {
    return <Loader className="animate-spin h-10 w-10" />;
  }

  if (error) {
    return <div>{JSON.stringify(error)}</div>;
  }

  return (
    <div className="w-full">
      <div className="rounded-md border">
        <Table className="min-w-full">
          <TableCaption>List of Candidates</TableCaption>
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
                  No candidates found.
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

export default CandidatesTable;
