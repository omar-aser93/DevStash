import { getCurrentUserId } from "@/lib/session";
import { getItemsByType } from "@/lib/queries/items";
import { ItemCard } from "@/components/dashboard/ItemCard";
import { ImageCard } from "@/components/dashboard/ImageCard";
import { FileListItem } from "@/components/dashboard/FileListItem";
import { FolderOpen } from "lucide-react";
import { CustomPagination } from "@/components/CustomPagination";

export const metadata = {
  title: "Items by Type | DevStash",
  description: "Browse your items filtered by type.",
};

interface PageProps {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function ItemsByTypePage({ params, searchParams }: PageProps) {
  const { type } = await params;
  const { page: pageParam } = await searchParams;
  const userId = await getCurrentUserId();

  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const limit = 20; // ITEMS_PER_PAGE

  const { items, type: itemType, total, totalPages } = await getItemsByType(
    userId,
    type,
    page,
    limit
  );

  const typeName = type.toLowerCase();

  const renderItems = () => {
    if (items.length === 0) {
      return (
        <div className="rounded-xl border bg-card/30 p-12 text-center">
          <p className="text-sm text-muted-foreground">No items found in this type.</p>
        </div>
      );
    }

    if (typeName === "image") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <ImageCard key={item.id} item={item} />
          ))}
        </div>
      );
    }

    if (typeName === "file") {
      return (
        <div className="space-y-2">
          {items.map((item) => (
            <FileListItem key={item.id} item={item} />
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background/50 p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <FolderOpen className="size-5 text-muted-foreground" />
          {itemType.name.charAt(0).toUpperCase() + itemType.name.slice(1)}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {total} item{total !== 1 ? "s" : ""} in this type
        </p>
      </div>

      {renderItems()}

      <CustomPagination
        currentPage={page}
        totalPages={totalPages}
        basePath={`/dashboard/items/${type}`}
      />
    </div>
  );
}