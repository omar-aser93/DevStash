"use client";

import { ItemWithType } from "@/lib/queries/items";
import { useItemDrawer } from "@/components/item-drawer/useItemDrawer";
import { ItemTypeIcon } from "@/components/dashboard/dashboard-utils";


export function ItemRow({ item }: { item: ItemWithType }) {
  const { openDrawer } = useItemDrawer();
  const formattedDate = new Date(item.updatedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  return (
    <div
      onClick={() => openDrawer(item.id)}
      className="flex items-center gap-3 px-4 py-2 hover:bg-muted/20 transition-colors cursor-pointer"
    >
      <ItemTypeIcon
        name={item.itemType.icon}
        className="size-4"
        style={{ color: item.itemType.color }}
      />
      <span className="font-mono text-sm truncate flex-1">{item.title}</span>
      <span className="text-xs font-mono text-muted-foreground bg-muted/30 px-2 py-0.5 rounded">
        {item.itemType.name}
      </span>
      <span className="text-xs font-mono text-muted-foreground">{formattedDate}</span>
    </div>
  );
}