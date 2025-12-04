import React, { useEffect, useState } from "react";
import { useGetAllVendorSpocQuery } from "../store/vendorsApiSlice";
import type { VendorSpocItem } from "../types";
import { Label } from "@/components/ui/label";
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
  value?: string; // vendor_spoc_id
  onChange?: (spoc: VendorSpocItem) => void;
  isDisabled?: boolean;
};

const VendorSpocCombobox: React.FC<VendorSpocComboboxProps> = ({
  value,
  onChange,
  isDisabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [selectedSpoc, setSelectedSpoc] = useState<VendorSpocItem>();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");

  // debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // query API
  const { data } = useGetAllVendorSpocQuery(
    { searchTerm },
    { refetchOnMountOrArgChange: true }
  );

  // set selected item if value changes
  useEffect(() => {
    if (value && data?.data) {
      const found = data.data.find((sp: VendorSpocItem) => sp.id === value);
      if (found) setSelectedSpoc(found);
    }
  }, [value, data]);

  return (
    <div className="w-full max-w-sm space-y-2">
      <Popover open={isDisabled ? false : open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="vendor-spoc"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[95vw] sm:w-[340px] max-w-[340px] h-16 justify-between"
            disabled={isDisabled}
          >
            {selectedSpoc ? (
              <div className="flex items-center gap-3 text-left w-full overflow-hidden">
                {selectedSpoc.photo ? (
                  <img
                    src={`${import.meta.env.VITE_API_BASE_API_URL}${
                      import.meta.env.VITE_RELATIVE_API_URL
                    }/${selectedSpoc.photo}`}
                    alt={selectedSpoc.full_name}
                    className="w-10 h-10 rounded-full object-cover border shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500 shrink-0">
                    N/A
                  </div>
                )}

                <div className="flex flex-col overflow-hidden">
                  <p className="font-medium text-md truncate">
                    {selectedSpoc.full_name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedSpoc.vendor?.vendor_name ?? "No Vendor Linked"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedSpoc.mobile_number}
                  </p>
                </div>
              </div>
            ) : (
              <span>Select a Vendor SPOC</span>
            )}

            <ChevronsUpDownIcon className="h-4 w-4 ml-auto" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[95vw] sm:w-[340px] max-w-[340px] p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search Vendor SPOC"
              className="h-9"
              value={searchInput}
              onValueChange={(val) => setSearchInput(val)}
              disabled={isDisabled}
            />
            <CommandList>
              <CommandEmpty>No Vendor SPOCs found</CommandEmpty>
              <CommandGroup>
                {data?.data &&
                  Array.isArray(data.data) &&
                  data.data.map((spoc: VendorSpocItem) => (
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
                      <div className="flex items-center gap-3 w-full">
                        {spoc.photo ? (
                          <img
                            src={`${import.meta.env.VITE_API_BASE_API_URL}${
                              import.meta.env.VITE_RELATIVE_API_URL
                            }/${spoc.photo}`}
                            alt={spoc.full_name}
                            className="w-10 h-10 rounded-full object-cover border"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                            N/A
                          </div>
                        )}
                        <div className="flex flex-col">
                          <p className="font-semibold">{spoc.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {spoc.vendor?.vendor_name ?? "No Vendor Linked"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {spoc.mobile_number}
                          </p>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default VendorSpocCombobox;
