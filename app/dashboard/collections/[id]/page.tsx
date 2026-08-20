import { notFound } from "next/navigation";
import { getCurrentUserId } from "@/lib/session";
import { getCollectionById } from "@/lib/queries/collections";
import { ItemCard } from "@/components/dashboard/ItemCard";
import { Folder, Calendar } from "lucide-react";
import { CollectionDetailActions } from "@/components/collections/CollectionDetailActions";

export const metadata = {
  title: "Collection | DevStash",
  description: "View items in this collection.",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CollectionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const userId = await getCurrentUserId();

  const collection = await getCollectionById(userId, id);

  if (!collection) {
    notFound();
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background/50 p-6 space-y-6">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Folder className="size-5 text-muted-foreground" />
              {collection.name}
            </h1>
            {collection.description && (
              <p className="text-sm text-muted-foreground mt-1">{collection.description}</p>
            )}
          </div>
          <CollectionDetailActions collection={collection} />
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="size-3.5" />
            Created {new Date(collection.createdAt).toLocaleDateString()}
          </span>
          <span>
            {collection.items.length} item{collection.items.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {collection.items.length === 0 ? (
        <div className="rounded-xl border bg-card/30 p-12 text-center">
          <p className="text-sm text-muted-foreground">This collection is empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {collection.items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}