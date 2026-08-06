import { Star } from "lucide-react";
import { MockCollection, MockItemType } from "@/lib/mock-data";
import { getItemTypeStyle, ItemTypeIcon, ItemTypeStyle } from "@/components/dashboard/dashboard-utils";
import { cn } from "@/lib/utils";

export interface RecentCollectionCardProps {
  collection: MockCollection;
  itemCount: number;
  containedTypes?: MockItemType[];
  style: ItemTypeStyle;
}

export function RecentCollectionCard({
  collection,
  itemCount,
  containedTypes = [],
  style,
}: RecentCollectionCardProps) {
  const borderLeftColor = style.color;

  return (
    <div
      className={cn(
        "group p-4 rounded-xl border border-l-4 bg-card/30 flex flex-col justify-between min-h-35 hover:-translate-y-0.5 duration-200",
        style.bg,
        style.borderLeft
      )}
      style={borderLeftColor ? { borderLeftColor } : undefined}
    >
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-sm line-clamp-1 group-hover:text-foreground transition-colors">
            <a href={`/collections/${collection.id}`} className="hover:underline">
              {collection.name}
            </a>
          </h3>
          {collection.isFavorite && (
            <Star className="size-3.5 fill-yellow-400 text-yellow-400 shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 min-h-8">
          {collection.description}
        </p>
      </div>
      <div className="flex items-center justify-between mt-4">
        <span className="text-[10px] text-muted-foreground font-medium">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </span>

        {/* Small icons for contained item types instead of "Open" */}
        <a
          href={`/collections/${collection.id}`}
          className="flex items-center gap-1.5 p-1 -m-1 rounded-md hover:bg-muted/20 transition-colors"
          title="Open collection"
        >
          {containedTypes.length > 0 ? (
            <div className="flex items-center gap-1">
              {containedTypes.map((type) => {
                const typeStyle = getItemTypeStyle(type.slug);
                return (
                  <span
                    key={type.id}
                    className={cn(
                      "p-1 rounded-md transition-transform hover:scale-110 flex items-center justify-center",
                      typeStyle.bg,
                      typeStyle.text
                    )}
                    title={type.name}
                  >
                    <ItemTypeIcon slug={type.slug} className="size-3.5" />
                  </span>
                );
              })}
            </div>
          ) : (
            <span className="text-[10px] font-semibold text-muted-foreground">
              Empty
            </span>
          )}
        </a>
      </div>
    </div>
  );
}
