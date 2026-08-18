import { getCurrentUserId } from "@/lib/session";
import { getItemsByType } from "@/lib/queries/items";
import { ItemCard } from "@/components/dashboard/ItemCard";
import { FolderOpen } from "lucide-react";

export const metadata = {
  title: "Items by Type | DevStash",
  description: "Browse your items filtered by type.",
};

interface PageProps {
  params: Promise<{ type: string }>;
}

export default async function ItemsByTypePage({ params }: PageProps) {
  const { type } = await params;
  const userId = await getCurrentUserId();

  // getItemsByType will throw notFound() if the type doesn't exist
  const { items, type: itemType } = await getItemsByType(userId, type);

  return (
    <div className="flex-1 overflow-y-auto bg-background/50 p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <FolderOpen className="size-5 text-muted-foreground" />
          {/* Use the actual type name from the DB to preserve case */}
          {itemType.name.charAt(0).toUpperCase() + itemType.name.slice(1)}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {items.length} item{items.length !== 1 ? "s" : ""} in this type
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border bg-card/30 p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No items found in this type.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}