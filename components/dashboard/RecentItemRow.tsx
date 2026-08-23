"use client";

import { Pin, Star } from "lucide-react";
import { ItemTypeIcon, getColorStyles } from "@/components/dashboard/dashboard-utils";
import { cn } from "@/lib/utils";
import type { ItemWithType } from "@/lib/queries/items";
import { useItemDrawer } from "@/components/item-drawer/useItemDrawer";

export interface RecentItemRowProps {
  item: ItemWithType;
  isFirst?: boolean;
}

export function RecentItemRow({ item, isFirst }: RecentItemRowProps) {
  const { openDrawer } = useItemDrawer();
  const styles = getColorStyles(item.itemType.color);

  const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  const handleClick = () => openDrawer(item.id);

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex items-start gap-3 transition-colors hover:bg-muted/10 p-2 -mx-2 rounded-lg border-l-2 pl-3 cursor-pointer",
        !isFirst && "pt-3"
      )}
      style={styles.borderLeft}
    >
      <span
        className="p-1.5 rounded-md mt-0.5 shrink-0"
        style={{ ...styles.bg, ...styles.text }}
      >
        <ItemTypeIcon name={item.itemType.icon} className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-semibold truncate hover:text-foreground transition-colors">
            {item.title}
          </h3>
          <div className="flex items-center gap-4 shrink-0">
            {item.isFavorite && (
              <Star className="size-3 fill-yellow-400 text-yellow-400 shrink-0" />
            )}
            {item.isPinned && (
              <Pin className="size-3 shrink-0 text-blue-400 fill-blue-400/20" />
            )}
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground line-clamp-1">
          {item.description}
        </p>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-0.5">
          <span className="font-medium">{item.itemType.name}</span>
          <span>•</span>
          <span>{formattedDate}</span>
        </div>
      </div>
    </div>
  );
}