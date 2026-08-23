import { Metadata } from "next";
import { getCurrentUser, getCurrentUserId } from "@/lib/session";
import { getItemStats, getItemTypesWithCounts } from "@/lib/queries/items";
import { getCollectionStats } from "@/lib/queries/collections";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ItemTypeIcon } from "@/components/dashboard/dashboard-utils";
import { Mail, User, Calendar, Database, Folder, Star } from "lucide-react";

export const metadata: Metadata = {
  title: "Profile | DevStash",
  description: "View and manage your DevStash user profile.",
};

export default async function ProfilePage() {
  const userId = await getCurrentUserId();
  const [user, itemStats, collectionStats, itemTypes] = await Promise.all([
    getCurrentUser(userId),
    getItemStats(userId),
    getCollectionStats(userId),
    getItemTypesWithCounts(userId),
  ]);

  return (
    <div className="flex-1 overflow-y-auto bg-background/50 p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal account details and preferences.
        </p>
      </div>

      {/* User Info Card */}
      <div className="max-w-full rounded-xl border bg-card/40 p-6 space-y-6">
        <div className="flex items-center gap-4">
          <UserAvatar
            name={user.name}
            email={user.email}
            image={user.image}
            size="lg"
            className="size-16 text-xl"
          />
          <div>
            <h2 className="text-lg font-semibold text-foreground">{user.name}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div className="border-t border-border pt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <User className="size-3.5" />
                Full Name
              </label>
              <p className="text-sm font-medium text-foreground bg-muted/30 border rounded-lg px-3 py-2">
                {user.name}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Mail className="size-3.5" />
                Email Address
              </label>
              <p className="text-sm font-medium text-foreground bg-muted/30 border rounded-lg px-3 py-2">
                {user.email}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                Member since
              </label>
              <p className="text-sm font-medium text-foreground px-3 py-1">
                {new Date(user.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight mb-4">Usage Statistics</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            label="Total Items"
            value={itemStats.totalItems}
            icon={Database}
            iconBgClass="bg-blue-500/10"
            iconColorClass="text-blue-400"
          />
          <StatsCard
            label="Collections"
            value={collectionStats.totalCollections}
            icon={Folder}
            iconBgClass="bg-indigo-500/10"
            iconColorClass="text-indigo-400"
          />
          <StatsCard
            label="Favorite Items"
            value={itemStats.favoriteItemsCount}
            icon={Star}
            iconBgClass="bg-amber-500/10"
            iconColorClass="text-amber-400"
            iconFillClass="fill-amber-400/20"
          />
          <StatsCard
            label="Favorite Collections"
            value={collectionStats.favoriteCollectionsCount}
            icon={Star}
            iconBgClass="bg-pink-500/10"
            iconColorClass="text-pink-400"
            iconFillClass="fill-pink-400/20"
          />
        </div>
      </div>

      {/* Item Type Breakdown */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight mb-4">Items by Type</h2>
        <div className="rounded-xl border bg-card/30 p-4">
          {itemTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No item types found.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {itemTypes.map((type) => (
                <div
                  key={type.id}
                  className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-2"
                >
                  <div className="flex items-center gap-2">
                    <ItemTypeIcon
                      name={type.icon}
                      className="size-4"
                      style={{ color: type.color }}
                    />
                    <span className="text-sm font-medium">{type.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {type.itemCount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
