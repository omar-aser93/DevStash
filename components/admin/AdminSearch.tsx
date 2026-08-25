"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function AdminSearch() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const showSearch =
    pathname === "/admin/users" || pathname === "/admin/blog";

  const [value, setValue] = useState(() => searchParams.get("q") || "");

  const handleSearch = useDebouncedCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value.length >= 2) {
      params.set("q", value);
    } else {
      params.delete("q");
    }

    // Start from page 1 when searching
    params.delete("page");

    router.push(`${pathname}?${params.toString()}`);
  }, 300);

  if (!showSearch) return null;

  return (
    <div className="relative flex-1 max-w-sm">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />

      <Input
        type="search"
        placeholder="Search..."
        className="pl-8 bg-[#12121a] border-[#1e1e2e] focus-visible:ring-1"
        value={value}
        onChange={(e) => {
          const newValue = e.target.value;

          setValue(newValue);
          handleSearch(newValue);
        }}
      />
    </div>
  );
}