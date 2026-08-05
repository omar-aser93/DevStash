import { FolderPlus, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarMobile } from "./SidebarMobile";

export function Navbar() {
  return (
    <header className="flex h-16 items-center border-b px-4 sm:px-6">

      {/* Left */}      
      <div className="flex flex-1 items-center gap-3">
        <SidebarMobile />
        <a href="/dashboard" className="flex items-center gap-2 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground"> DS </span>
          <span className="hidden text-lg sm:inline">DevStash</span>
        </a>
      </div>      

      {/* Center */}
      <div className="hidden flex-1 justify-center md:flex">
        <label className="relative w-full max-w-lg">
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input aria-label="Search DevStash" className="h-9 w-full rounded-lg border bg-transparent pr-3 pl-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50" placeholder="Search your stash..." type="search" />
        </label>
      </div>  

      {/* Right */}
      <div className="flex flex-1 justify-end gap-2"> 
        <Button aria-label="New collection" className="size-8 cursor-pointer sm:w-auto sm:px-2.5" variant="outline">
          <FolderPlus aria-hidden="true" />
          <span className="hidden sm:inline">New collection</span>
        </Button>
        <Button aria-label="New item" className="size-8 cursor-pointer sm:w-auto sm:px-2.5">
          <Plus aria-hidden="true" />
          <span className="hidden sm:inline">New item</span>
        </Button>
      </div>
    </header>
  );
}
