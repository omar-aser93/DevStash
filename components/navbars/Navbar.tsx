"use client";

import { useState } from "react";
import { FolderOpen, FolderPlus, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarMobile } from "./SidebarMobile";
import { CreateItemDialog } from "@/components/CreateItemDialog";
import { CollectionFormDialog } from "@/components/collections/CollectionFormDialog";
import { SidebarContentProps } from "@/components/navbars/SidebarContent";
import { useSearch } from "@/components/search/SearchProvider";
import Link from "next/link";


interface NavbarProps extends Omit<SidebarContentProps, "collapsed" | "setCollapsed" | "mobile"> {
  collections: { id: string; name: string }[];
}


export function Navbar({ collections, ...sidebarProps }: NavbarProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const { setOpen: setSearchOpen } = useSearch();

  return (
    <header className="sticky top-0 z-50 bg-background flex h-16 items-center border-b px-4 sm:px-6">
      {/* Left */}
      <div className="flex flex-1 items-center gap-3">
        <SidebarMobile {...sidebarProps}/>
        <Link href="/" className="flex items-center gap-2.5 font-bold text-sm sm:text-lg text-[#e4e4ef]">
          <FolderOpen className="size-5 sm:size-7" />
          DevStash
        </Link>
      </div>

      {/* Center */}
      <div className="hidden flex-1 justify-center md:flex">
        <label className="relative w-full max-w-lg cursor-text" onClick={() => setSearchOpen(true)}>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <div className="flex h-9 w-full items-center rounded-lg border bg-transparent pr-3 pl-9 text-sm text-muted-foreground transition-colors">
            <span>Search your stash...</span>
            <kbd className="ml-auto hidden rounded border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
              ⌘K
            </kbd>
          </div>
          <input
            className="sr-only"
            aria-label="Search DevStash"
            type="search"
            onFocus={(e) => {
              e.preventDefault();
              setSearchOpen(true);
            }}
          />
        </label>
      </div>

      {/* Right */}
      <div className="flex flex-1 justify-end gap-2">
        <Button
          aria-label="Search"
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="size-5" />
        </Button>
        <Button
          aria-label="New collection"
          className="size-8 sm:w-auto sm:px-2.5"
          variant="outline"
          onClick={() => setCollectionOpen(true)}
        >
          <FolderPlus aria-hidden="true" />
          <span className="hidden sm:inline">New collection</span>
        </Button>
        <Button
          aria-label="New item"
          className="size-8 sm:w-auto sm:px-2.5"
          onClick={() => setCreateOpen(true)}
        >
          <Plus aria-hidden="true" />
          <span className="hidden sm:inline">New item</span>
        </Button>
      </div>

      <CreateItemDialog open={createOpen} onOpenChange={setCreateOpen} collections={collections}/>
      <CollectionFormDialog open={collectionOpen} onOpenChange={setCollectionOpen} />
    </header>
  );
}
