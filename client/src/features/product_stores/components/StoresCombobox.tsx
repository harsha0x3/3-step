import React, { useEffect, useId, useState } from "react";
import { useGetAllStoresQuery } from "../store/productStoresApiSlice";
import { useSelector } from "react-redux";
import { selectAuth } from "@/features/auth/store/authSlice";
import type { StoreItemWithUser } from "../types";
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
  isDisabled?: boolean;
};

const StoresCombobox: React.FC<StoresComboboxProps> = ({
  value,
  onChange,
  isDisabled = false,
}) => {
  const [searchBy, setSearchBy] = useState<string>("city");
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
        currentUserInfo.role !== "admin" &&
        currentUserInfo.role !== "super_admin" &&
        currentUserInfo.role !== "registration_officer",
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
      <Popover open={isDisabled ? false : open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={selectedStore?.id ?? "selected-store"}
            variant={"outline"}
            role="combobox"
            aria-expanded={open}
            disabled={isDisabled}
            className="w-[95vw] sm:w-[340px] max-w-[340px] h-16 justify-between"
          >
            {selectedStore ? (
              <div className="flex flex-col text-left overflow-hidden">
                <p className="text-md truncate">{selectedStore.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {selectedStore.address}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {selectedStore.city}
                </p>
              </div>
            ) : (
              <span>Select a store</span>
            )}

            <ChevronsUpDownIcon className="h-4 w-4 shrink-0 ml-2" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[95vw] sm:w-[340px] max-w-[340px] p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search Store by City name"
              className="h-9"
              value={searchInput || ""}
              onValueChange={(val) => setSearchInput(val)}
              disabled={isDisabled}
            />
            <CommandList>
              <CommandEmpty>No Stores found</CommandEmpty>
              <CommandGroup>
                {data?.data?.stores &&
                  Array.isArray(data?.data?.stores) &&
                  data?.data?.stores.map((store: StoreItemWithUser) => {
                    return (
                      <CommandItem
                        disabled={isDisabled}
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
                          <p className="text-md">{store.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {store.address}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {store.city}
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
