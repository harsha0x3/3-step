// src/features/regions/components/MultiRegionCombobox.tsx
import React, { useEffect, useRef, useState, useMemo } from "react";
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
import { ChevronsUpDownIcon, CheckIcon } from "lucide-react";
import { useGetAllRegionsQuery } from "../store/regionsApiSlice";
import type { RegionOut } from "@/store/rootTypes";
import { cn } from "@/lib/utils";

type Props = {
  values?: string[];
  selectedRegions?: RegionOut[]; // 👈 ADD THIS
  onChange?: (regionIds: string[], regions: RegionOut[]) => void;
  disabled?: boolean;
};

const MultiRegionCombobox: React.FC<Props> = ({
  values = [],
  onChange,
  selectedRegions,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }

    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(handler);
  }, [search]);

  // 🔹 Server-side search
  const { data, isFetching } = useGetAllRegionsQuery(
    debouncedSearch ? { name: debouncedSearch } : undefined
  );

  const regions = useMemo(() => data?.data ?? [], [data]);

  console.log("REGIONS: ", regions);

  const displayRegions = useMemo(
    () => selectedRegions ?? [],
    [selectedRegions]
  );

  const buttonLabel = useMemo(() => {
    if (displayRegions.length === 0) return "Select Regions";
    if (displayRegions.length <= 2)
      return displayRegions.map((r) => r.name).join(", ");
    return `${displayRegions.length} regions selected`;
  }, [displayRegions]);

  const toggleRegion = (region: RegionOut) => {
    let nextIds: string[];

    if (values.includes(region.id)) {
      nextIds = values.filter((id) => id !== region.id);
    } else {
      nextIds = [...values, region.id];
    }

    onChange?.(
      nextIds,
      regions.filter((r) => nextIds.includes(r.id))
    );
  };
  console.log("VALUES >>>", values);
  return (
    <Popover open={!disabled && open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between truncate"
          disabled={disabled}
        >
          <span className="truncate">{buttonLabel}</span>
          <ChevronsUpDownIcon className="w-4 h-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="p-0 w-[--radix-popover-trigger-width]">
        <Command>
          <CommandInput
            placeholder="Search regions..."
            value={search}
            onValueChange={setSearch}
          />

          {regions.length === 0 && (
            <CommandEmpty>
              {isFetching ? "Searching..." : "No regions found"}
            </CommandEmpty>
          )}

          <CommandGroup className="max-h-60 overflow-y-auto">
            {regions.map((region) => {
              const selected = values.includes(region.id);
              console.log("SELECTED", selected);

              return (
                <CommandItem
                  key={region.id}
                  value={region.name}
                  onSelect={() => toggleRegion(region)}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {region.name}
                </CommandItem>
              );
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default MultiRegionCombobox;
