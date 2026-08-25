import { getCurrentUserId } from "@/lib/session";
import { getItemsByTag } from "@/lib/queries/items";
import { ItemCard } from "@/components/dashboard/ItemCard";
import { ImageCard } from "@/components/dashboard/ImageCard";
import { FileListItem } from "@/components/dashboard/FileListItem";
import { CustomPagination } from "@/components/CustomPagination";
import { Tag } from "lucide-react";

export const metadata = {
  title: "Tag | DevStash",
  description: "View items tagged with this tag.",
};

interface PageProps {
  params: Promise<{ tag: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function TagPage({ params, searchParams }: PageProps) {
  const { tag } = await params;
  const { page: pageParam } = await searchParams;
  const userId = await getCurrentUserId();

  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const limit = 21;

  const { items, tag: tagData, total, totalPages } = await getItemsByTag(
    userId,
    tag,
    page,
    limit
  );

  const renderItems = () => {
    if (items.length === 0) {
      return (
        <div className="rounded-xl border bg-card/30 p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No items found with this tag.
          </p>
        </div>
      );
    }

    // Check if all items are images
    const allImages = items.every((item) => item.itemType.name.toLowerCase() === "image");
    const allFiles = items.every((item) => item.itemType.name.toLowerCase() === "file");

    if (allImages) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <ImageCard key={item.id} item={item} />
          ))}
        </div>
      );
    }

    if (allFiles) {
      return (
        <div className="space-y-2">
          {items.map((item) => (
            <FileListItem key={item.id} item={item} />
          ))}
        </div>
      );
    }

    // Default: grid of ItemCard
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
          <Tag className="size-5 text-muted-foreground" />
          #{tagData.name}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {total} item{total !== 1 ? "s" : ""} with this tag
        </p>
      </div>

      {renderItems()}

      <CustomPagination
        currentPage={page}
        totalPages={totalPages}
        basePath={`/dashboard/tags/${tag}`}
      />
    </div>
  );
}