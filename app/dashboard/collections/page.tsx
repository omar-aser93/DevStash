import { getCurrentUserId } from "@/lib/session";
import { getAllCollectionsWithMeta } from "@/lib/queries/collections";
import { RecentCollectionCard } from "@/components/dashboard/RecentCollectionCard";
import { Folder } from "lucide-react";

export const metadata = {
  title: "Collections | DevStash",
  description: "Browse all your collections.",
};

export default async function CollectionsPage() {
  const userId = await getCurrentUserId();
  const collections = await getAllCollectionsWithMeta(userId);

  return (
    <div className="flex-1 overflow-y-auto bg-background/50 p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Folder className="size-5 text-muted-foreground" />
          Collections
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {collections.length} collection{collections.length !== 1 ? "s" : ""}
        </p>
      </div>

      {collections.length === 0 ? (
        <div className="rounded-xl border bg-card/30 p-12 text-center">
          <p className="text-sm text-muted-foreground">No collections yet. Create one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <RecentCollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      )}
    </div>
  );
}