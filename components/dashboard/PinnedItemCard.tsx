import { Star } from "lucide-react";
import { ItemTypeIcon, getColorStyles } from "@/components/dashboard/dashboard-utils";
import type { ItemWithType } from "@/lib/queries/items";

export interface PinnedItemCardProps {
  item: ItemWithType;
}

export function PinnedItemCard({ item }: PinnedItemCardProps) {
  const styles = getColorStyles(item.itemType.color);

  return (
    <div
      className="group p-4 rounded-xl border border-l-4 border-muted/50 bg-card/20 flex flex-col justify-between min-h-35 hover:bg-card/40 transition-colors"
      style={styles.borderLeft}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1.5 rounded-md" style={{ ...styles.bg, ...styles.text }}>
              <ItemTypeIcon name={item.itemType.icon} className="size-3.5" />
            </span>
            <h3 className="font-medium text-sm truncate group-hover:text-foreground transition-colors">
              {item.title}
            </h3>
          </div>
          {item.isFavorite && (
            <Star className="size-3.5 fill-yellow-400 text-yellow-400 shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 min-h-8">
          {item.description}
        </p>
      </div>

      <div className="flex flex-col gap-2.5 mt-4">
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center text-[9px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t pt-2 border-muted/50">
          <span>{item.itemType.name}</span>
          <a
            href={`/items/${item.itemType.name}?id=${item.id}`}
            className="font-semibold hover:text-foreground hover:underline"
          >
            View details
          </a>
        </div>
      </div>
    </div>
  );
}
