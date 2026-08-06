import { Star } from "lucide-react";
import { MockItem, MockItemType } from "@/lib/mock-data";
import { getItemTypeStyle, ItemTypeIcon } from "@/components/dashboard/dashboard-utils";
import { cn } from "@/lib/utils";

export interface RecentItemRowProps {
  item: MockItem;
  itemType?: MockItemType;
  isFirst?: boolean;
}

export function RecentItemRow({ item, itemType, isFirst }: RecentItemRowProps) {
  const typeSlug = itemType?.slug || "snippets";
  const style = getItemTypeStyle(typeSlug);
  const borderLeftColor = itemType?.color || style.color;

  const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className={cn(
        "flex items-start gap-3 transition-colors hover:bg-muted/10 p-2 -mx-2 rounded-lg border-l-2 border-l-transparent pl-3",
        !isFirst && "pt-3"
      )}
      style={borderLeftColor ? { borderLeftColor } : undefined}
    >
      <span className={cn("p-1.5 rounded-md mt-0.5 shrink-0", style.bg, style.text)}>
        <ItemTypeIcon slug={typeSlug} className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xs font-semibold truncate hover:text-foreground transition-colors">
            <a href={`/items/${typeSlug}?id=${item.id}`}>{item.title}</a>
          </h3>
          {item.isFavorite && (
            <Star className="size-3 fill-yellow-400 text-yellow-400 shrink-0" />
          )}
        </div>
        <p className="text-[11px] text-muted-foreground line-clamp-1">
          {item.description}
        </p>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-0.5">
          <span className="font-medium">{itemType?.name}</span>
          <span>•</span>
          <span>{formattedDate}</span>
        </div>
      </div>
    </div>
  );
}
