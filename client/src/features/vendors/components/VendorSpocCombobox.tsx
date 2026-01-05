// src\features\vendors\components\VendorSpocCombobox.tsx
import React, { useEffect, useRef, useState } from "react";
import { useGetAllVendorSpocQuery } from "../store/vendorsApiSlice";
import type { VendorSpocItem } from "../types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronsUpDownIcon } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

type VendorSpocComboboxProps = {
  value?: string;
  onChange?: (spoc: VendorSpocItem) => void;
  isDisabled?: boolean;
};

const PAGE_SIZE = 15;

const VendorSpocCombobox: React.FC<VendorSpocComboboxProps> = ({
  value,
  onChange,
  isDisabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [selectedSpoc, setSelectedSpoc] = useState<VendorSpocItem>();
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<VendorSpocItem[]>([]);

  const listRef = useRef<HTMLDivElement | null>(null);

  // ✅ debounce search
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return; // skip clearing + debounce on first mount
    }

    const handler = setTimeout(() => {
      if (searchInput) {
        setSearchTerm(searchInput);
        setPage(1);
        setItems([]);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchInput]);

  // ✅ API call (paginated)
  const { data, isFetching } = useGetAllVendorSpocQuery(
    {
      page: -1,
      page_size: PAGE_SIZE,
      sort_by: "created_at",
      sort_order: "asc",
      search_by: "vendor_name",
      search_term: searchTerm,
    },
    { refetchOnMountOrArgChange: true }
  );

  // ✅ Merge pages
  useEffect(() => {
    if (data?.data?.vendor_spocs) {
      setItems((prev) =>
        page === 1
          ? data.data.vendor_spocs
          : [...prev, ...data.data.vendor_spocs]
      );
    }
  }, [data, page]);

  // ✅ preload selected value
  useEffect(() => {
    if (value && items.length) {
      const found = items.find((sp) => sp.id === value);
      if (found) setSelectedSpoc(found);
    }
  }, [value, items]);

  // ✅ infinite scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
      if (!isFetching && data?.data?.count === PAGE_SIZE) {
        setPage((prev) => prev + 1);
      }
    }
  };

  return (
    <div className="w-full max-w-sm">
      <Popover open={isDisabled ? false : open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full h-16 justify-between"
            disabled={isDisabled}
          >
            {selectedSpoc ? (
              <div className="flex flex-col text-left overflow-hidden">
                <p className="font-medium truncate">{selectedSpoc.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {selectedSpoc.vendor?.vendor_name}
                </p>
              </div>
            ) : (
              <span>Select Vendor SPOC</span>
            )}
            <ChevronsUpDownIcon className="h-4 w-4 ml-auto" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search by vendor name"
              value={searchInput}
              onValueChange={setSearchInput}
              disabled={isDisabled}
            />

            <CommandList
              ref={listRef}
              className="max-h-[300px] overflow-y-auto"
              onScroll={handleScroll}
            >
              <CommandEmpty>No Vendor SPOCs found</CommandEmpty>
              <CommandGroup>
                {items.map((spoc) => (
                  <CommandItem
                    key={spoc.id}
                    value={spoc.id}
                    onSelect={() => {
                      setSelectedSpoc(spoc);
                      setOpen(false);
                      onChange?.(spoc);
                    }}
                    disabled={isDisabled}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{spoc.full_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {spoc.vendor?.vendor_name} | {spoc.mobile_number}
                      </span>
                    </div>
                  </CommandItem>
                ))}

                {isFetching && (
                  <div className="text-xs text-center py-2 text-muted-foreground">
                    Loading more…
                  </div>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default VendorSpocCombobox;
