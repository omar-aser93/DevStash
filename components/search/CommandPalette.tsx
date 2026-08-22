"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { DialogTitle } from "@/components/ui/dialog";
import { useSearch } from "./SearchProvider";
import { useItemDrawer } from "@/components/item-drawer/useItemDrawer";
import { ItemTypeIcon } from "@/components/dashboard/dashboard-utils";
import { Folder } from "lucide-react";
import Fuse from "fuse.js";

interface SearchItem {
  id: string;
  title: string;
  content: string;
  itemType: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
}

interface SearchCollection {
  id: string;
  name: string;
  _count: {
    items: number;
  };
}

interface CommandPaletteProps {
  items: SearchItem[];
  collections: SearchCollection[];
}

export function CommandPalette({ items, collections }: CommandPaletteProps) {
  const { open, setOpen, toggle } = useSearch();
  const router = useRouter();
  const { openDrawer } = useItemDrawer();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();        
        toggle();
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [toggle]);

  // Fuse search instances
  const itemFuse = new Fuse(items, {
    keys: ["title", "content"],
    threshold: 0.4,
    ignoreLocation: true,
  });

  const collectionFuse = new Fuse(collections, {
    keys: ["name"],
    threshold: 0.4,
    ignoreLocation: true,
  });

  const filteredItems = query.trim() ? itemFuse.search(query).map((r) => r.item) : items;
  const filteredCollections = query.trim() ? collectionFuse.search(query).map((r) => r.item) : collections;

  const handleSelectItem = (id: string) => {
    setOpen(false);
    openDrawer(id);
  };

  const handleSelectCollection = (id: string) => {
    setOpen(false);
    router.push(`/dashboard/collections/${id}`);
  };

  // Reset query when dialog closes
  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) { setQuery(""); }
  };

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange}>
      <DialogTitle className="sr-only">Search DevStash</DialogTitle>
      <CommandInput
        placeholder="Search your stash... (⌘K)"
        value={query}
        onValueChange={setQuery}       
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {filteredItems.length > 0 && (
          <CommandGroup heading="Items">
            {filteredItems.map((item) => (
              <CommandItem
                key={item.id}
                onSelect={() => handleSelectItem(item.id)}
                className="flex items-center gap-2 my-0.5 cursor-pointer"
              >
                <ItemTypeIcon
                  name={item.itemType.icon}
                  className="size-4"
                  style={{ color: item.itemType.color }}
                />
                <span>{item.title}</span>
                {item.content && (
                  <span className="text-xs text-muted-foreground truncate max-w-50">
                    {item.content.slice(0, 60)}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {filteredCollections.length > 0 && (
          <CommandGroup heading="Collections">
            {filteredCollections.map((collection) => (
              <CommandItem
                key={collection.id}
                onSelect={() => handleSelectCollection(collection.id)}
                className="flex items-center gap-2 my-0.5 cursor-pointer"
              >
                <Folder className="size-4 text-muted-foreground" />
                <span>{collection.name}</span>
                <span className="text-xs text-muted-foreground">
                  {collection._count.items} item{collection._count.items !== 1 ? "s" : ""}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}