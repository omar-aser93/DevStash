"use client";

import { Code, ChevronDown, File, Folder, Image, Link as LinkIcon, PanelLeftClose, PanelLeftOpen, Sparkles, Star, StickyNote, Terminal } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { collections, currentUser, items, itemTypes } from "@/lib/mock-data";
import { Button } from "../ui/button";
import { useState } from "react";

const TYPE_ICONS: Record<string, LucideIcon> = {
  snippets: Code,
  prompts: Sparkles,
  commands: Terminal,
  notes: StickyNote,
  files: File,
  images: Image,
  links: LinkIcon,
};

const TYPE_COLORS: Record<string, string> = {
  snippets: "text-blue-500",
  prompts: "text-violet-500",
  commands: "text-orange-500",
  notes: "text-yellow-300",
  files: "text-slate-400",
  images: "text-pink-500",
  links: "text-emerald-500",
};


export function SidebarContent({ collapsed, setCollapsed, mobile = false }: { collapsed?: boolean; setCollapsed?: React.Dispatch<React.SetStateAction<boolean>>; mobile?: boolean;}) {
  
  const favoriteCollections = collections.filter((collection) => collection.isFavorite );
  const recentCollections = [...collections].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 3);
 
  const [collectionsOpen, setCollectionsOpen] = useState(true);
  return (
    <div className="sidebar-navigation flex h-full flex-col bg-muted/20">
      <div className="sidebar-navigation-header flex h-16 items-center justify-between border-b px-4">
        <span className={cn("transition-all overflow-hidden whitespace-nowrap", collapsed ? "hidden opacity-0" : "w-auto opacity-100" )} >
          Navigation
        </span>
        {!mobile && setCollapsed && (
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(v => !v)} >
            {collapsed ? ( <PanelLeftOpen /> ) : ( <PanelLeftClose /> )}
          </Button>
        )}
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto p-3" aria-label="Dashboard navigation" >
       {!collapsed && ( <SidebarSectionLabel>Types</SidebarSectionLabel> )}  
        <div className="space-y-1">
          {itemTypes.map((type) => {
            const Icon = TYPE_ICONS[type.slug];
            const itemCount = items.filter((item) => item.itemTypeId === type.id,).length;

            return (
              <a className="flex h-9 items-center gap-3 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" href={`/items/${type.slug}`} key={type.id} title={type.name} >
                <Icon aria-hidden="true" className={cn("size-4 shrink-0", TYPE_COLORS[type.slug])} />
                {!collapsed && ( 
                  <span className="sidebar-text min-w-0 flex-1 truncate">
                   {type.name}s
                  </span>)}
                {!collapsed && ( <span className="sidebar-text text-xs">{itemCount}</span> )}
              </a>
            );
          })}
        </div>

        {!collapsed && (<> 
        <div className="my-5 border-t" />
        <Button variant="ghost" className={`w-full flex items-center justify-between border-0 ${collectionsOpen ? "mb-6" : "mb-0"}`} onClick={() => setCollectionsOpen((v) => !v)}>
          Collections
          <ChevronDown className={cn( "transition-transform", collectionsOpen && "rotate-180" )} />
        </Button>
        {collectionsOpen && (
          <div className="sidebar-collections-content">
            <SidebarSectionLabel>Favorites</SidebarSectionLabel>
            <div className="space-y-1">
              {favoriteCollections.map((collection) => (
                <a className="flex h-9 items-center gap-3 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" href={`/collections/${collection.id}`} key={collection.id} title={collection.name} >
                  <Folder aria-hidden="true" className="size-4 shrink-0" />
                  <span className="sidebar-text min-w-0 flex-1 truncate">
                    {collection.name}
                  </span>
                  <Star aria-hidden="true" className="sidebar-text size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
                </a>
              ))}
            </div>

            <SidebarSectionLabel className="mt-5">Recent</SidebarSectionLabel>
            <div className="space-y-1">
              {recentCollections.map((collection) => (
                <a className="flex h-9 items-center gap-3 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" href={`/collections/${collection.id}`} key={collection.id} title={collection.name} >
                  <Folder aria-hidden="true" className="size-4 shrink-0" />
                  <span className="sidebar-text min-w-0 flex-1 truncate">
                    {collection.name}
                  </span>
                </a>
              ))}
            </div>            
          </div>            
        )}
        </>)}
      </nav>

      <div className="border-t p-3">
        <a className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted" href="/settings" >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
            {getInitials(currentUser.name)}
          </span>
          {!collapsed && (<span className="sidebar-text min-w-0">
            <span className="block truncate text-sm font-medium">
              {currentUser.name}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {currentUser.email}
            </span>
          </span>)}
        </a>
      </div>
    </div>
  );
}

function SidebarSectionLabel({ children, className }: { children: React.ReactNode; className?: string;}) {
  return (
    <p className={cn("sidebar-section-label mb-2 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground", className)}>
      {children}
    </p>
  );
}
