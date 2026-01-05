// src/features/product_stores/components/CityCombobox.tsx
import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { useGetAllCitiesQuery } from "../store/productStoresApiSlice";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export const CityCombobox: React.FC<Props> = ({ value, onChange }) => {
  const [open, setOpen] = React.useState(false);
  const { data: citiesData } = useGetAllCitiesQuery();
  const cities = React.useMemo(() => {
    return citiesData?.data ?? [];
  }, [citiesData]);

  return (
    <div className="w-full max-w-xs space-y-2">
      {value && <Label htmlFor={"filter-by-city"}>Filter By City</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-60 justify-between"
            id="filter-by-city"
          >
            {value ? value : "Filter by city"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-60 p-0">
          <Command>
            <CommandInput placeholder="Search city..." />
            <CommandList>
              <CommandEmpty>No cities found.</CommandEmpty>

              <CommandGroup>
                <CommandItem
                  key="all"
                  value=""
                  onSelect={() => {
                    onChange("");
                    setOpen(false);
                  }}
                >
                  All Cities
                  {!value && <Check className="ml-auto h-4 w-4" />}
                </CommandItem>

                {cities.map((city) => (
                  <CommandItem
                    key={city.id}
                    value={city.name}
                    onSelect={() => {
                      onChange(city.name);
                      setOpen(false);
                    }}
                  >
                    {city.name}
                    {value === city.name && (
                      <Check className="ml-auto h-4 w-4" />
                    )}
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
