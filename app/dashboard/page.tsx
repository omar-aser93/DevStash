import { FolderPlus, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="grid h-16 grid-cols-[1fr_auto_1fr] items-center border-b px-4 sm:px-6">
        <div>
          <a
            className="inline-flex items-center gap-2 rounded-md text-lg font-semibold tracking-tight outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring/50"
            href="/dashboard"
          >
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-bold tracking-tight text-primary-foreground">
              DS
            </span>
            DevStash
          </a>
        </div>

        <label className="relative hidden sm:block">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              aria-label="Search DevStash"
              className="h-9 w-64 rounded-lg border bg-transparent pr-3 pl-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
              placeholder="Search your stash..."
              type="search"
            />
        </label>

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" className="cursor-pointer">
            <FolderPlus aria-hidden="true" />
            New collection
          </Button>
          <Button className="cursor-pointer">
            <Plus aria-hidden="true" />
            New item
          </Button>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-4rem)] md:grid-cols-[16rem_1fr]">
        <aside className="border-b p-6 md:border-r md:border-b-0">
          <h2 className="text-sm font-semibold">Sidebar</h2>
        </aside>
        <main className="p-6">
          <h2 className="text-sm font-semibold">Main</h2>
        </main>
      </div>
    </div>
  );
}
