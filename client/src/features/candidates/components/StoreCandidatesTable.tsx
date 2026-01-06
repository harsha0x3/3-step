import React, { lazy, Suspense } from "react";
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
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";

type Props = {
  candidates: PartialCandidateItem[];
  isLoading: boolean;
  error: string;
  isFromUpgrade?: boolean;
};

const StoreCandidatesTable: React.FC<Props> = ({
  candidates,
  isLoading,
  error,
  isFromUpgrade = false,
}) => {
  const [openIssuanceDialog, setOpenIssuanceDialog] = React.useState(false);
  const IssuanceDetailsDialog = lazy(() => import("./IssuanceDetailsDialog"));
  const [selectedCandidate, setSelectedCandidate] =
    React.useState<PartialCandidateItem | null>(null);
  const [showUpgradeConfirm, setShowUpgradeConfirm] =
    React.useState<boolean>(false);

  const columnHelper = createColumnHelper<PartialCandidateItem>();

  const navigate = useNavigate();

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
              <Button
                variant={"link"}
                onClick={() => {
                  setOpenIssuanceDialog(true);
                  setSelectedCandidate(row.original);
                }}
              >
                View
              </Button>
            )}
          </div>
        );
      },
    }),
    ...(isFromUpgrade
      ? [
          columnHelper.accessor("scheduled_at", {
            header: "Scheduled At",
            cell: (info) => info.getValue(),
          }),
          columnHelper.accessor("upgrade_product_info", {
            header: "Upgrade Details",
            cell: (info) => info.getValue(),
          }),
          columnHelper.accessor("cost_of_upgrade", {
            header: "Additional Cost",
            cell: (info) => info.getValue(),
          }),
        ]
      : []),
    columnHelper.accessor("is_requested_for_upgrade", {
      header: "Upgrade",
      cell: ({ row, getValue }) => {
        const status = getValue();
        return (
          <div className="flex items-center justify-center">
            {status && row.original.issued_status !== "issued" ? (
              <Button
                onClick={() => {
                  setShowUpgradeConfirm(true);
                  setSelectedCandidate(row.original);
                }}
              >
                Process Upgrade
              </Button>
            ) : row.original.issued_status !== "issued" ? (
              <span>Issued</span>
            ) : (
              <span>Not Requested</span>
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
              City: {[store.city.map((c) => c.name)].join(", ")}
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
      {openIssuanceDialog && selectedCandidate && (
        <Suspense fallback={<Loader className="animate-spin h-5 w-5 ml-2" />}>
          <IssuanceDetailsDialog
            candidateId={selectedCandidate.id}
            defOpen={openIssuanceDialog}
            onOpenChange={() => {
              setSelectedCandidate(null);
              setOpenIssuanceDialog(false);
            }}
          />
        </Suspense>
      )}
      {showUpgradeConfirm && (
        <AlertDialog
          open={showUpgradeConfirm}
          onOpenChange={setShowUpgradeConfirm}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-center">
                Review Beneficiary Details
              </AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription asChild>
              <div className="rounded-md border p-4 flex items-center gap-4 justify-center">
                <div className="flex justify-center mt-4">
                  <img
                    src={`${
                      import.meta.env.VITE_API_BASE_API_URL
                    }/hard_verify/api/v1.0/secured_file?path=${encodeURIComponent(
                      selectedCandidate.photo
                    )}`}
                    className="w-32 h-32 border rounded-md object-cover"
                  />
                </div>
                <div className="text-sm space-y-1">
                  <p>
                    <strong>ID:</strong> {selectedCandidate.id}
                  </p>
                  <p>
                    <strong>Name:</strong> {selectedCandidate.full_name}
                  </p>
                  <p>
                    <strong>Mobile:</strong> {selectedCandidate.mobile_number}
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogAction asChild>
                <Button
                  onClick={() => {
                    navigate(
                      `/store/beneficiary/${selectedCandidate.id}/verify/otp`
                    );
                  }}
                >
                  Proceed
                </Button>
              </AlertDialogAction>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
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
