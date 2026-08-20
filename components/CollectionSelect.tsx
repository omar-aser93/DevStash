"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger,} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface CollectionOption {
  id: string;
  name: string;
}

interface CollectionSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: CollectionOption[];
  placeholder?: string;
  className?: string;
}

export function CollectionSelect({
  value,
  onChange,
  options,
  placeholder = "Select collections...",
  className,
}: CollectionSelectProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (collectionId: string) => {
    const newValue = value.includes(collectionId)
      ? value.filter((id) => id !== collectionId)
      : [...value, collectionId];
    onChange(newValue);
  };

  const selectedNames = value
    .map((id) => options.find((o) => o.id === id)?.name)
    .filter(Boolean)
    .join(", ");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={(props) => (
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between font-normal",
              !value.length && "text-muted-foreground",
              className
            )}
            {...props}
          >
            <span className="truncate">
              {value.length > 0 ? selectedNames : placeholder}
            </span>
            {value.length > 0 && (
              <Badge variant="secondary" className="ml-auto mr-2 shrink-0">
                {value.length}
              </Badge>
            )}
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        )}
      />
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search collections..." />
          <CommandList>
            <CommandEmpty>No collections found.</CommandEmpty>
            <CommandGroup>
              {options.map((collection) => (
                <CommandItem
                  key={collection.id}
                  value={collection.id}
                  onSelect={() => handleSelect(collection.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      value.includes(collection.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {collection.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}