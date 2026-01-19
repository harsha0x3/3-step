// src/features/product_stores/components/StoresTable.tsx
import React from "react";
import {
  type ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { StoreItemWithUser } from "../types"; // adjust path to your types file
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // adjust path to your shadcn table components
import { Loader } from "lucide-react";
import StoreFormDialog from "./StoreFormDialog";
import { useSelector } from "react-redux";
import { selectAuth } from "@/features/auth/store/authSlice";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

type Props = {
  stores: StoreItemWithUser[];
  bodyMaxHeight?: string;
  isLoading: boolean;
  error: string;
};

const StoreTable: React.FC<Props> = ({ stores, isLoading, error }) => {
  const currentUserInfo = useSelector(selectAuth);
  const [editOpen, setEditOpen] = React.useState(false);
  const [selectedStore, setSelectedStore] =
    React.useState<StoreItemWithUser | null>(null);
  const navigate = useNavigate();

  const columnHelper = createColumnHelper<StoreItemWithUser>();

  const columns: ColumnDef<StoreItemWithUser, any>[] = [
    columnHelper.accessor("id", {
      size: 100,
      maxSize: 150,
      minSize: 100,
      header: "Store Code",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("name", {
      header: "Store Name",
      size: 180,
      maxSize: 200,
      minSize: 180,
      cell: (info) => (
        <span className="wrap-break-word">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("city", {
      header: "City",
      cell: (info) => {
        const cities = info.getValue();
        return (
          <p className="whitespace-normal wrap-break-word">
            {[cities.map((c) => c.name)].join(", ")}
          </p>
        );
      },
    }),
    // columnHelper.accessor("count", {
    //   header: "Total Stock",
    //   size: 80,
    //   maxSize: 150,
    //   minSize: 80,
    //   cell: (info) => (
    //     <span className="whitespace-normal wrap-break w-full text-center">
    //       {info.getValue()}
    //     </span>
    //   ),
    // }),
    // columnHelper.display({
    //   id: "available_slots",
    //   header: "Slots Available",
    //   size: 80,
    //   maxSize: 150,
    //   minSize: 80,
    //   cell: ({ row }) => {
    //     return (
    //       <span className="text-center whitespace-normal wrap-break w-full">
    //         {row.original.count -
    //           (row.original?.total_assigned_candidates ?? 0)}
    //       </span>
    //     );
    //   },
    // }),
    columnHelper.accessor("total_assigned_candidates", {
      header: () => (
        <div className="flex flex-col items-center">
          <span>Issued Laptops /</span>
          <span>Assigned Beneficieries</span>
        </div>
      ),
      size: 150,
      maxSize: 150,
      minSize: 80,
      cell: ({ row, getValue }) => {
        const totalAssignedCandidates = getValue();
        const totalLaptopsIssued = row.original.total_laptops_issued;
        return (
          <p className="whitespace-normal wrap-break max-w-[16rem] w-full text-center">
            {`${totalLaptopsIssued} / ${totalAssignedCandidates}`}
          </p>
        );
      },
    }),
  ];

  if (["super_admin", "admin"].includes(currentUserInfo.role)) {
    columns.push(
      columnHelper.accessor("store_agents", {
        header: "Store Agents",
        cell: (info) => {
          const store_agents = info.getValue();
          if (!store_agents) return "-";

          return (
            <ol className="flex flex-col">
              {Array.isArray(store_agents) && store_agents.length > 0
                ? store_agents.map((agent) => (
                    <li key={agent.id}>
                      <p>Agent Name: {agent.full_name}</p>
                    </li>
                  ))
                : "-"}
            </ol>
          );
        },
      }),
      columnHelper.display({
        id: "view-beneficiaries",
        header: "View Beneficiaries",
        cell: ({ row }) => {
          const storeId = row.original.id;
          return (
            <>
              <Button
                variant={"link"}
                onClick={() =>
                  navigate(`/beneficiary/all?beneficiaryStoreId=${storeId}`)
                }
                size={"sm"}
              >
                View Beneficiaries
              </Button>
            </>
          );
        },
      })
    );
  }

  if (["super_admin"].includes(currentUserInfo.role)) {
    columns.push(
      // 🆕 Add this column for store_person

      columnHelper.display({
        id: "edit_store",
        header: "Actions",
        cell: ({ row }) => {
          return (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedStore(row.original);
                  setEditOpen(true);
                }}
              >
                Edit
              </Button>
            </>
          );
        },
      })
    );
  }

  const table = useReactTable({
    data: stores,
    columns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: "onChange",
  });

  if (isLoading) {
    return <Loader className="animate-spin h-10 w-10" />;
  }

  if (error) {
    return <div>{JSON.stringify(error)}</div>;
  }

  return (
    <div className="min-w-[700px] sm:min-w-full overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="sm:max-h-[475px] overflow-auto">
        {selectedStore && (
          <StoreFormDialog
            store={selectedStore}
            defOpen={editOpen}
            onOpenChange={() => {
              setEditOpen(false);
              setSelectedStore(null);
            }}
          />
        )}
        {/* Use a table element provided by shadcn components */}
        <Table className="w-full table-fixed">
          <TableCaption>List of Stores</TableCaption>
          {/* TableHeader render - we'll rely on shadcn's TableHeader + TableHead components */}
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    // make header sticky so it stays visible while body scrolls
                    className="sticky top-0 z-20 bg-background whitespace-normal wrap-break-word leading-snug"
                    style={{ width: header.getSize() }}
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
                  No stores found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                      className="whitespace-normal wrap-break"
                    >
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

export default StoreTable;
