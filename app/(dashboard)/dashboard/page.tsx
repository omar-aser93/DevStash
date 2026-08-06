import { Metadata } from "next";
import { Folder, Database, Star, Pin, Clock, ArrowRight} from "lucide-react";
import { collections, items, itemTypes, currentUser } from "@/lib/mock-data";
import { getDominantTypeStyles, getCollectionItemTypes } from "@/components/dashboard/dashboard-utils";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentCollectionCard } from "@/components/dashboard/RecentCollectionCard";
import { PinnedItemCard } from "@/components/dashboard/PinnedItemCard";
import { RecentItemRow } from "@/components/dashboard/RecentItemRow";

export const metadata: Metadata = {
  title: "Dashboard | DevStash",
  description: "Browse and organize your developer knowledge in DevStash.",
};

export default function DashboardPage() {
  // Sort collections by updatedAt to get recent collections
  const recentCollections = [...collections].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 3);

  // Get pinned items
  const pinnedItems = items.filter((item) => item.isPinned);

  // Get 10 recent items
  const recentItems = [...items].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 10);

  // Stat counts
  const totalItems = items.length;
  const totalCollections = collections.length;
  const favoriteItemsCount = items.filter((item) => item.isFavorite).length;
  const favoriteCollectionsCount = collections.filter((col) => col.isFavorite).length;

  return (
    <div className="flex-1 overflow-y-auto bg-background/50 p-6 space-y-8">
      {/* Welcome / Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {currentUser.name}!</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Keep your code snippets, terminal commands, and developer knowledge perfectly organized.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          label="Total Items"
          value={totalItems}
          icon={Database}
          iconBgClass="bg-blue-500/10"
          iconColorClass="text-blue-400"
        />
        <StatsCard 
          label="Collections"
          value={totalCollections}
          icon={Folder}
          iconBgClass="bg-indigo-500/10"
          iconColorClass="text-indigo-400"
        />
        <StatsCard 
          label="Favorite Items"
          value={favoriteItemsCount}
          icon={Star}
          iconBgClass="bg-amber-500/10"
          iconColorClass="text-amber-400"
          iconFillClass="fill-amber-400/20"
        />
        <StatsCard 
          label="Favorite Collections"
          value={favoriteCollectionsCount}
          icon={Star}
          iconBgClass="bg-pink-500/10"
          iconColorClass="text-pink-400"
          iconFillClass="fill-pink-400/20"
        />
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        {/* Left Column: Recent Collections & Pinned Items */}
        <div className="xl:col-span-2 space-y-8">
          {/* Recent Collections */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                <Folder className="size-4 text-muted-foreground" />
                Recent Collections
              </h2>
              <a href="/collections" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                View all <ArrowRight className="size-3" />
              </a>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {recentCollections.map((collection) => {
                const style = getDominantTypeStyles(collection.id, items, itemTypes);
                const colItemsCount = items.filter((it) => it.collectionIds.includes(collection.id)).length;
                const containedTypes = getCollectionItemTypes(collection.id, items, itemTypes);
                return (
                  <RecentCollectionCard 
                    key={collection.id}
                    collection={collection}
                    itemCount={colItemsCount}
                    containedTypes={containedTypes}
                    style={style}
                  />
                );
              })}
            </div>
          </section>

          {/* Pinned Items */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                <Pin className="size-4 text-muted-foreground" />
                Pinned Items
              </h2>
            </div>
            {pinnedItems.length === 0 ? (
              <div className="p-8 rounded-xl border border-dashed text-center">
                <p className="text-sm text-muted-foreground">No pinned items yet. Pin items to access them quickly here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {pinnedItems.map((item) => {
                  const type = itemTypes.find((t) => t.id === item.itemTypeId);
                  return (
                    <PinnedItemCard 
                      key={item.id}
                      item={item}
                      itemType={type}
                    />
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: 10 Recent Items List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              Recent Items
            </h2>
          </div>
          <div className="rounded-xl border bg-card/30 p-4 space-y-4">
            {recentItems.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No items created yet.</p>
            ) : (
              <div className="divide-y divide-muted/50 space-y-3">
                {recentItems.map((item, idx) => {
                  const type = itemTypes.find((t) => t.id === item.itemTypeId);
                  return (
                    <RecentItemRow
                      key={item.id}
                      item={item}
                      itemType={type}
                      isFirst={idx === 0}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
