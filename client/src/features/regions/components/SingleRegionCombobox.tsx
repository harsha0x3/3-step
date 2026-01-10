// src/features/regions/components/SingleRegionCombobox.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandInput,
  CommandEmpty,
} from "@/components/ui/command";
import { ChevronsUpDownIcon } from "lucide-react";
import { useGetAllRegionsQuery } from "../store/regionsApiSlice";
import type { RegionOut } from "@/store/rootTypes";

type Props = {
  value?: string;
  selected?: RegionOut;
  onChange?: (region: RegionOut) => void;
  disabled?: boolean;
};

const SingleRegionCombobox: React.FC<Props> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return; // skip clearing + debounce on first mount
    }

    const handler = setTimeout(() => {
      if (search) {
        setDebouncedSearch(search);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [search]);

  // 🔹 Server-side search
  const { data, isFetching } = useGetAllRegionsQuery(
    search ? { name: debouncedSearch } : undefined
  );

  const selected = data?.data?.find((r) => r.id === value);

  return (
    <Popover open={!disabled && open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between"
          disabled={disabled}
        >
          {selected?.name ?? "Select Region"}
          <ChevronsUpDownIcon className="w-4 h-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="p-0 w-[--radix-popover-trigger-width]">
        <Command shouldFilter={false}>
          {/* 🔍 Search */}
          <CommandInput
            placeholder="Search region..."
            value={search}
            onValueChange={setSearch}
          />

          <CommandEmpty>
            {isFetching ? "Searching..." : "No regions found"}
          </CommandEmpty>

          <CommandGroup>
            {data?.data?.map((region) => (
              <CommandItem
                key={region.id}
                value={region.name}
                onSelect={() => {
                  onChange?.(region);
                  setOpen(false);
                }}
              >
                {region.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default SingleRegionCombobox;
