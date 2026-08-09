"use client";

import { ChevronDown, Folder, PanelLeftClose, PanelLeftOpen, Star } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { ItemTypeIcon, getColorStyles } from "@/components/dashboard/dashboard-utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import type { ItemTypeWithCount } from "@/lib/queries/items";
import type { SidebarCollection } from "@/lib/queries/collections";

export interface SidebarUser {
  name: string;
  email: string;
}

export interface SidebarContentProps {
  collapsed?: boolean;
  setCollapsed?: React.Dispatch<React.SetStateAction<boolean>>;
  mobile?: boolean;
  currentUser: SidebarUser;
  itemTypes: ItemTypeWithCount[];
  favoriteCollections: SidebarCollection[];
  recentCollections: SidebarCollection[];
}

// Item types that are gated behind a Pro plan
const PRO_ITEM_TYPES = new Set(["file", "image"]);


export function SidebarContent({collapsed, setCollapsed, mobile = false, currentUser, itemTypes, favoriteCollections, recentCollections}: SidebarContentProps) {
  const [typesOpen, setTypesOpen] = useState(true);
  const [collectionsOpen, setCollectionsOpen] = useState(true);

  return (
    <div className="sidebar-navigation flex h-full flex-col bg-muted/20">
      <div className="sidebar-navigation-header flex h-16 items-center justify-between border-b px-4">
        <span className={cn("transition-all overflow-hidden whitespace-nowrap", collapsed ? "hidden opacity-0" : "w-auto opacity-100")}>
          Navigation
        </span>
        {!mobile && setCollapsed && (
          <Button variant="ghost" size="icon" onClick={() => setCollapsed((v) => !v)}>
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
        )}
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto p-3" aria-label="Dashboard navigation">
        {!collapsed && (
          <Button variant="ghost" onClick={() => setTypesOpen((v) => !v)} className={`w-full flex items-center justify-between border-0 ${typesOpen ? "mb-2" : "mb-0"}`} >
            Types
            <ChevronDown className={cn("transition-transform", typesOpen && "rotate-180")} />
          </Button>
        )}
        {typesOpen && (
          <div className="space-y-1">
            {itemTypes.map((type) => {
              const styles = getColorStyles(type.color);
              const isPro = PRO_ITEM_TYPES.has(type.name.toLowerCase());
              return (
                <a className="flex h-9 items-center gap-3 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" href={`/items/${type.name}`} key={type.id} title={type.name} >
                  <ItemTypeIcon name={type.icon} aria-hidden="true" className="size-4 shrink-0" style={styles.text} />
                  {!collapsed && (
                    <span className="sidebar-text min-w-0 flex-1 truncate">{type.name}s</span>
                  )}
                  {!collapsed && isPro && (
                    <Badge variant="secondary" className="sidebar-text h-4 shrink-0 px-1.5 py-0 text-[10px] font-medium leading-none text-muted-foreground" >
                      Pro
                    </Badge>
                  )}
                  {!collapsed && <span className="sidebar-text text-xs">{type.itemCount}</span>}
                </a>
              );
            })}
          </div>
        )}

        {!collapsed && (
          <>
            <div className="my-5 border-t" />
            <Button variant="ghost" onClick={() => setCollectionsOpen((v) => !v)} className={`w-full flex items-center justify-between border-0 ${collectionsOpen ? "mb-6" : "mb-0"}`} >
              Collections
              <ChevronDown className={cn("transition-transform", collectionsOpen && "rotate-180")} />
            </Button>
            {collectionsOpen && (
              <div className="sidebar-collections-content">
                <SidebarSectionLabel>Favorites</SidebarSectionLabel>
                <div className="space-y-1">
                  {favoriteCollections.map((collection) => (
                    <a href={`/collections/${collection.id}`} key={collection.id} title={collection.name} className="flex h-9 items-center gap-3 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" >
                      <Folder aria-hidden="true" className="size-4 shrink-0" />
                      <span className="sidebar-text min-w-0 flex-1 truncate">{collection.name}</span>
                      <Star aria-hidden="true" className="sidebar-text size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
                    </a>
                  ))}
                </div>

                <SidebarSectionLabel className="mt-5">Recent</SidebarSectionLabel>
                <div className="space-y-1">
                  {recentCollections.map((collection) => (
                    <a href={`/collections/${collection.id}`} key={collection.id} title={collection.name} className="flex h-9 items-center gap-3 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" >
                      <Folder aria-hidden="true" className="size-4 shrink-0" />
                      <span className="sidebar-text min-w-0 flex-1 truncate">{collection.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </nav>

      <div className="border-t p-3">
        <a className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted" href="/settings">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
            {getInitials(currentUser.name)}
          </span>
          {!collapsed && (
            <span className="sidebar-text min-w-0">
              <span className="block truncate text-sm font-medium">{currentUser.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{currentUser.email}</span>
            </span>
          )}
        </a>
      </div>
    </div>
  );
}

function SidebarSectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("sidebar-section-label mb-2 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground", className)}>
      {children}
    </p>
  );
}

