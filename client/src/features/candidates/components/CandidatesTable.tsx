import React, { lazy, Suspense } from "react";
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
import { EyeIcon, Loader } from "lucide-react";
import CandidateFormDialog from "./CandidateFormDialog";
import { useSelector } from "react-redux";
import { selectAuth } from "@/features/auth/store/authSlice";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

type Props = {
  candidates: CandidateItemWithStore[];
  isLoading: boolean;
  error: string;
};

const CandidatesTable: React.FC<Props> = ({ candidates, isLoading, error }) => {
  const currentUserInfo = useSelector(selectAuth);
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = React.useState(false);
  const [openIssuanceDialog, setOpenIssuanceDialog] = React.useState(false);
  const IssuanceDetailsDialog = lazy(() => import("./IssuanceDetailsDialog"));
  const [selectedCandidate, setSelectedCandidate] =
    React.useState<CandidateItemWithStore | null>(null);

  const columnHelper = createColumnHelper<CandidateItemWithStore>();

  const columns: ColumnDef<CandidateItemWithStore, any>[] = [
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

    columnHelper.accessor("city", {
      header: "City",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("state", {
      header: "State",
      cell: (info) => info.getValue(),
    }),

    columnHelper.accessor("aadhar_number", {
      header: "Aadhaar Number",
      cell: (info) => info.getValue(),
    }),

    columnHelper.accessor("is_candidate_verified", {
      header: "Voucher Issue Status",
      cell: ({ row, getValue }) => {
        const verified = getValue();
        const verifier = row.original.verified_by; // <-- access full name

        return (
          <div className="flex flex-col">
            <span className={``}>
              {verified ? (
                <>
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium hover:cursor-default ${
                          verified ? "bg-green-300/50 text-green-600" : ""
                        }`}
                      >
                        Issued
                      </span>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="grid grid-cols-[100px_1fr]">
                        <strong>Issuer Name:</strong>
                        <p>{verifier?.full_name}</p>
                      </div>
                      <div className="grid grid-cols-[100px_1fr]">
                        <strong>Issuer Email:</strong>
                        <p>{verifier?.email}</p>
                      </div>
                      <div className="grid grid-cols-[100px_1fr]">
                        <strong>Issued Location:</strong>
                        <p>{verifier?.location}</p>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </>
              ) : (
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    verified ? "" : "bg-red-300/50 text-red-600"
                  }`}
                >
                  Not Issued
                </span>
              )}
            </span>
          </div>
        );
      },
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
    columnHelper.display({
      id: "verify-candidate",
      header: "Actions",
      cell: ({ row }) => {
        const candidate = row.original;
        if (currentUserInfo.role === "registration_officer") {
          return (
            <Button
              size="sm"
              onClick={() => {
                navigate(
                  `/registration_officer/beneficiary/verify/${candidate.id}`
                );
              }}
            >
              Issue Voucher
            </Button>
          );
        }
        if (
          currentUserInfo.role === "admin" ||
          currentUserInfo.role === "super_admin"
        ) {
          return (
            <div className="flex items-center gap-2">
              <Button
                variant={"outline"}
                onClick={() => {
                  setOpenDialog(true);
                  setSelectedCandidate(candidate);
                }}
              >
                <EyeIcon />
              </Button>
            </div>
          );
        } else {
          return null;
        }
      },
    }),
  ];

  if (["super_admin", "admin"].includes(currentUserInfo.role)) {
    columns.push(
      columnHelper.accessor("gift_card_code", {
        id: "gift_card_code",
        header: "Gift Card Code",
        cell: ({ row }) => {
          const code = row.original.gift_card_code;
          return code ? (
            <span className="font-medium">{code}</span>
          ) : (
            <span className="text-muted-foreground">No Gift Card</span>
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

  if (
    currentUserInfo.role !== "admin" &&
    currentUserInfo.role !== "super_admin" &&
    currentUserInfo.role !== "registration_officer"
  ) {
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
      {openDialog && selectedCandidate && (
        <CandidateFormDialog
          candidate={selectedCandidate}
          store_id={selectedCandidate.store_id}
          toVerify={false}
          defOpen={openDialog}
          onOpenChange={() => {
            setOpenDialog(false);
            setSelectedCandidate(null);
          }}
        />
      )}
      {openIssuanceDialog && selectedCandidate && (
        <Suspense fallback={<Loader className="animate-spin h-5 w-5 ml-2" />}>
          <IssuanceDetailsDialog
            candidate={selectedCandidate}
            defOpen={openIssuanceDialog}
            onOpenChange={() => {
              setSelectedCandidate(null);
              setOpenIssuanceDialog(false);
            }}
          />
        </Suspense>
      )}
      <div className="min-w-[700px] sm:min-w-full overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="sm:max-h-[475px] overflow-auto">
          <Table className="">
            <TableCaption>List of Beneficiary Employees</TableCaption>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="sticky top-0 z-20 bg-card shadow-sm"
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
    </div>
  );
};

export default CandidatesTable;
