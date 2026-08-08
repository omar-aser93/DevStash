import { Star } from "lucide-react";
import { ItemTypeIcon, getColorStyles } from "@/components/dashboard/dashboard-utils";
import { cn } from "@/lib/utils";
import type { ItemWithType } from "@/lib/queries/items";

export interface RecentItemRowProps {
  item: ItemWithType;
  isFirst?: boolean;
}

export function RecentItemRow({ item, isFirst }: RecentItemRowProps) {
  const styles = getColorStyles(item.itemType.color);

  const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className={cn(
        "flex items-start gap-3 transition-colors hover:bg-muted/10 p-2 -mx-2 rounded-lg border-l-2 pl-3",
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
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xs font-semibold truncate hover:text-foreground transition-colors">
            <a href={`/items/${item.itemType.name}?id=${item.id}`}>{item.title}</a>
          </h3>
          {item.isFavorite && (
            <Star className="size-3 fill-yellow-400 text-yellow-400 shrink-0" />
          )}
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
