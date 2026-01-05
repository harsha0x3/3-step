import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { useGetAllCitiesQuery } from "../store/productStoresApiSlice";

interface Props {
  value?: string[];
  onChange: (value: string[]) => void;
  label?: string;
}

const MultiCityCombobox: React.FC<Props> = ({
  value,
  onChange,
  label = "Cities",
}) => {
  const [open, setOpen] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);

  // ✅ normalize value
  const selectedValues = value ?? [];

  const { data: citiesData } = useGetAllCitiesQuery();
  const cities = citiesData?.data ?? [];

  const toggleSelection = (cityId: string) => {
    onChange(
      selectedValues.includes(cityId)
        ? selectedValues.filter((v) => v !== cityId)
        : [...selectedValues, cityId]
    );
  };

  const removeSelection = (cityId: string) => {
    onChange(selectedValues.filter((v) => v !== cityId));
  };

  const maxShownItems = 2;
  const visibleItems = expanded
    ? selectedValues
    : selectedValues.slice(0, maxShownItems);

  const hiddenCount = selectedValues.length - visibleItems.length;

  return (
    <div className="w-full space-y-2">
      <Label>{label}</Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="min-h-9 w-full justify-between h-auto"
          >
            <div className="flex flex-wrap gap-1">
              {selectedValues.length > 0 ? (
                <>
                  {visibleItems.map((cityId) => {
                    const city = cities.find((c) => c.id === cityId);
                    if (!city) return null;

                    return (
                      <Badge key={cityId} variant="outline">
                        {city.name}
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSelection(cityId);
                          }}
                          className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded hover:bg-muted"
                        >
                          <X className="h-3 w-3" />
                        </span>
                      </Badge>
                    );
                  })}

                  {hiddenCount > 0 && (
                    <Badge
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpanded((prev) => !prev);
                      }}
                    >
                      {expanded ? "Show less" : `+${hiddenCount} more`}
                    </Badge>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground">Select cities</span>
              )}
            </div>

            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[--radix-popper-anchor-width] p-0">
          <Command>
            <CommandInput placeholder="Search city..." />
            <CommandList>
              <CommandEmpty>No cities found.</CommandEmpty>

              <CommandGroup>
                {cities.map((city) => (
                  <CommandItem
                    key={city.id}
                    value={city.name}
                    onSelect={() => toggleSelection(city.id)}
                  >
                    {city.name}
                    {selectedValues.includes(city.id) && (
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

export default MultiCityCombobox;
