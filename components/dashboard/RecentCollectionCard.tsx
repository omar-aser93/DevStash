import { Star } from "lucide-react";
import { ItemTypeIcon, getColorStyles } from "@/components/dashboard/dashboard-utils";
import type { CollectionWithMeta } from "@/lib/queries/collections";

export interface RecentCollectionCardProps {
  collection: CollectionWithMeta;
}

export function RecentCollectionCard({ collection }: RecentCollectionCardProps) {
  const styles = getColorStyles(collection.dominantColor);

  return (
    <div
      className="group p-4 rounded-xl border border-l-4 border-muted/50 bg-card/30 flex flex-col justify-between min-h-35 transition-all hover:-translate-y-0.5 hover:shadow-md duration-200"
      style={{ ...styles.bg, ...styles.borderLeft }}
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
          {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
        </span>

        {/* Small icons for contained item types instead of "Open" */}
        <a
          href={`/collections/${collection.id}`}
          className="flex items-center gap-1.5 p-1 -m-1 rounded-md hover:bg-muted/20 transition-colors"
          title="Open collection"
        >
          {collection.containedTypes.length > 0 ? (
            <div className="flex items-center gap-1">
              {collection.containedTypes.map((type) => {
                const typeStyles = getColorStyles(type.color);
                return (
                  <span
                    key={type.id}
                    className="p-1 rounded-md transition-transform hover:scale-110 flex items-center justify-center"
                    style={{ ...typeStyles.bg, ...typeStyles.text }}
                    title={type.name}
                  >
                    <ItemTypeIcon name={type.icon} className="size-3.5" />
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
