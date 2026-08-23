import { Metadata } from "next";
import { getCurrentUserId } from "@/lib/session";
import { getFavoriteItems } from "@/lib/queries/items";
import { getFavoriteCollections } from "@/lib/queries/collections";
import { FavoritesContent } from "@/components/favorites/FavoritesContent";

export const metadata: Metadata = {
  title: "Favorites | DevStash",
  description: "View your favorite items and collections.",
};

export default async function FavoritesPage() {
  const userId = await getCurrentUserId();
  const [items, collections] = await Promise.all([
    getFavoriteItems(userId),
    getFavoriteCollections(userId),
  ]);

  return (
    <div className="flex-1 bg-background/50 p-6 space-y-8">
      <FavoritesContent items={items} collections={collections} />
    </div>
  );
}
