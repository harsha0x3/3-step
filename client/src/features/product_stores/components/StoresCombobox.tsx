import React, { useEffect, useId, useState } from "react";
import { useGetAllStoresQuery } from "../store/productStoresApiSlice";
import { useSelector } from "react-redux";
import { selectAuth } from "@/features/auth/store/authSlice";
import type { StoreItemWithUser } from "../types";
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

type StoresComboboxProps = {
  value?: string; // current store id
  onChange?: (store: StoreItemWithUser) => void; // callback when store selected
  disabled?: boolean;
};

const StoresCombobox: React.FC<StoresComboboxProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [searchBy, serSearchBy] = useState<string>("store_name");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const [open, setOpen] = useState(false);

  const currentUserInfo = useSelector(selectAuth);

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 500); // adjust debounce delay (ms)

    return () => {
      clearTimeout(handler);
    };
  }, [searchInput]);

  const { data } = useGetAllStoresQuery(
    { searchBy, searchTerm },
    {
      skip:
        currentUserInfo.role !== "admin" && currentUserInfo.role !== "verifier",
    }
  );

  const [selectedStore, setSelectedStore] = useState<StoreItemWithUser>();
  useEffect(() => {
    if (value && data?.data?.stores) {
      const found = data.data.stores.find(
        (s: StoreItemWithUser) => s.id === value
      );
      if (found) setSelectedStore(found);
    }
  }, [value, data]);

  return (
    <div className="w-full max-w-sm space-y-2">
      <Label htmlFor={selectedStore?.id ?? "selected-store"}>Stores</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={selectedStore?.id ?? "selected-store"}
            variant={"outline"}
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-16"
          >
            {selectedStore ? (
              <div className="felx flex-col gap-1">
                <p className="text-md">{selectedStore.store_name}</p>
                <p className="text-sm">{selectedStore.address}</p>
                <p className="text-sm">{selectedStore.contact_number}</p>
              </div>
            ) : (
              <div>Select a store</div>
            )}
            <ChevronsUpDownIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search Store"
              className="h-9"
              value={searchInput || ""}
              onValueChange={(val) => setSearchInput(val)}
            />
            <CommandList>
              <CommandEmpty>No Stores found</CommandEmpty>
              <CommandGroup>
                {data?.data?.stores &&
                  Array.isArray(data?.data?.stores) &&
                  data?.data?.stores.map((store: StoreItemWithUser) => {
                    return (
                      <CommandItem
                        key={store.id}
                        value={store.id}
                        onSelect={() => {
                          console.log("SELECTED STORE", store);
                          setSelectedStore(store);
                          setOpen(false);
                          onChange?.(store);
                        }}
                      >
                        <div className="felx flex-col gap-1">
                          <p className="text-md">{store.store_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {store.address}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {store.contact_number}
                          </p>
                        </div>
                      </CommandItem>
                    );
                  })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default StoresCombobox;
