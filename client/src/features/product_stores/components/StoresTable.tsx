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
import AddCandidate from "@/features/candidates/components/CandidateFormDialog";
import StoreFormDialog from "./StoreFormDialog";

type Props = {
  stores: StoreItemWithUser[];
  bodyMaxHeight?: string;
  isLoading: boolean;
  error: string;
};

const columnHelper = createColumnHelper<StoreItemWithUser>();

const columns: ColumnDef<StoreItemWithUser, any>[] = [
  columnHelper.accessor("name", {
    header: "Store Name",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("city", {
    header: "City",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("address", {
    header: "Address",
    cell: (info) => {
      const address = info.getValue();
      return (
        <p className="whitespace-normal wrap-break max-w-[16rem]">{address}</p>
      );
    },
  }),

  // 🆕 Add this column for store_person
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
    id: "add_candidate",
    header: "Add Candidate",
    cell: ({ row }) => <AddCandidate store_id={row.original.id} />,
  }),

  columnHelper.display({
    id: "edit_store",
    header: "Edit Store",
    cell: ({ row }) => <StoreFormDialog store={row.original} />,
  }),
];

const StoreTable: React.FC<Props> = ({ stores, isLoading, error }) => {
  const table = useReactTable({
    data: stores,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return <Loader className="animate-spin h-10 w-10" />;
  }

  if (error) {
    return <div>{JSON.stringify(error)}</div>;
  }

  return (
    <div className="w-full">
      {/* Outer wrapper keeps header visible; the scrollable area is the inner div */}
      <div
        className="rounded-md border" /* no manual color, uses shadcn's border via tailwind tokens */
      >
        {/* Use a table element provided by shadcn components */}
        <Table className="w-full">
          <TableCaption>List of Stores</TableCaption>
          {/* TableHeader render - we'll rely on shadcn's TableHeader + TableHead components */}
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    // make header sticky so it stays visible while body scrolls
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
                  No stores found.
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

export default StoreTable;
