import React, { useEffect, useState } from "react";
import { useGetAllVendorsQuery } from "../store/vendorsApiSlice";
import type { VendorItem } from "../types";
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

type VendorsComboboxProps = {
  value?: string; // vendor_id
  onChange?: (vendor: VendorItem) => void;
  disabled?: boolean;
};

const VendorsCombobox: React.FC<VendorsComboboxProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<VendorItem>();

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 500); // adjust debounce delay (ms)

    return () => {
      clearTimeout(handler);
    };
  }, [searchInput]);

  const { data } = useGetAllVendorsQuery(
    { searchTerm },
    {
      skip: disabled,
    }
  );

  useEffect(() => {
    if (value && data?.data) {
      const found = data.data.find((v: VendorItem) => v.id === value);
      if (found) setSelectedVendor(found);
    }
  }, [value, data]);

  return (
    <div className="w-full max-w-sm space-y-2">
      <Label htmlFor="vendor">Vendor</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="vendor"
            variant={"outline"}
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-14"
            disabled={disabled}
          >
            {selectedVendor ? (
              <div className="flex flex-col text-left">
                <p className="text-md font-medium">
                  {selectedVendor.vendor_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedVendor.location}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedVendor.contact}
                </p>
              </div>
            ) : (
              <div>Select a vendor</div>
            )}
            <ChevronsUpDownIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search Vendor"
              className="h-9"
              value={searchInput || ""}
              onValueChange={(val) => setSearchInput(val)}
            />
            <CommandList>
              <CommandEmpty>No Vendors found</CommandEmpty>
              <CommandGroup>
                {data?.data &&
                  Array.isArray(data.data) &&
                  data.data.map((vendor: VendorItem) => (
                    <CommandItem
                      key={vendor.id}
                      value={vendor.id}
                      onSelect={() => {
                        setSelectedVendor(vendor);
                        setOpen(false);
                        onChange?.(vendor);
                      }}
                    >
                      <div className="flex flex-col">
                        <p className="font-medium">{vendor.vendor_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {vendor.location}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {vendor.contact}
                        </p>
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

export default VendorsCombobox;
