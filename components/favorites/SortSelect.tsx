"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SortSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
}

export function SortSelect({ value, onValueChange, options }: SortSelectProps) {
  const handleValueChange = (val: string | null) => {
    if (val) onValueChange(val);
  };

  return (
    <Select value={value} onValueChange={handleValueChange}>
      <SelectTrigger className="w-40">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent className="bg-black">
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}