"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface TimezoneComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  timezones: string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function TimezoneCombobox({
  value,
  onValueChange,
  timezones,
  placeholder = "Select timezone...",
  disabled = false,
  className,
}: TimezoneComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  // Group timezones by region
  const groupedTimezones = React.useMemo(() => {
    const groups: Record<string, string[]> = {
      Americas: [],
      Europe: [],
      Asia: [],
      Africa: [],
      Australia: [],
      Pacific: [],
      Other: [],
    };

    timezones.forEach((tz) => {
      const [region] = tz.split("/");
      if (region === "America") {
        groups.Americas.push(tz);
      } else if (region === "Europe") {
        groups.Europe.push(tz);
      } else if (region === "Asia") {
        groups.Asia.push(tz);
      } else if (region === "Africa") {
        groups.Africa.push(tz);
      } else if (region === "Australia" || region === "Antarctica") {
        groups.Australia.push(tz);
      } else if (region === "Pacific") {
        groups.Pacific.push(tz);
      } else {
        groups.Other.push(tz);
      }
    });

    // Remove empty groups
    return Object.entries(groups).filter(([, tzs]) => tzs.length > 0);
  }, [timezones]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", !value && "text-muted-foreground", className)}
          disabled={disabled}
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search timezone..." value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>No timezone found.</CommandEmpty>
            {groupedTimezones.map(([region, tzs]) => {
              // Filter timezones based on search
              const filteredTzs = tzs.filter((tz) =>
                tz.toLowerCase().includes(search.toLowerCase())
              );

              if (filteredTzs.length === 0) return null;

              return (
                <CommandGroup key={region} heading={region}>
                  {filteredTzs.map((timezone) => (
                    <CommandItem
                      key={timezone}
                      value={timezone}
                      onSelect={() => {
                        onValueChange(timezone);
                        setOpen(false);
                        setSearch("");
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === timezone ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {timezone}
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
