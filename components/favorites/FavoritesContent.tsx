"use client";

import { useState, useMemo } from "react";
import { Star, Folder } from "lucide-react";
import { ItemRow } from "./ItemRow";
import { CollectionRow } from "./CollectionRow";
import { SortSelect } from "./SortSelect";
import type { ItemWithType } from "@/lib/queries/items";
import type { SidebarCollection } from "@/lib/queries/collections";

interface FavoritesContentProps {
  items: ItemWithType[];
  collections: SidebarCollection[];
}

type SortOption = "recent" | "name-asc" | "name-desc" | "type";

const itemSortOptions = [
  { value: "recent", label: "Most Recent" },
  { value: "name-asc", label: "Name (A–Z)" },
  { value: "name-desc", label: "Name (Z–A)" },
  { value: "type", label: "Type" },
];

const collectionSortOptions = [
  { value: "recent", label: "Most Recent" },
  { value: "name-asc", label: "Name (A–Z)" },
  { value: "name-desc", label: "Name (Z–A)" },
];

export function FavoritesContent({ items, collections }: FavoritesContentProps) {
  const [itemSort, setItemSort] = useState<SortOption>("recent");
  const [collectionSort, setCollectionSort] = useState<SortOption>("recent");

  const sortedItems = useMemo(() => {
    const sorted = [...items];
    switch (itemSort) {
      case "recent":
        return sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      case "name-asc":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case "name-desc":
        return sorted.sort((a, b) => b.title.localeCompare(a.title));
      case "type":
        return sorted.sort((a, b) => a.itemType.name.localeCompare(b.itemType.name));
      default:
        return sorted;
    }
  }, [items, itemSort]);

const sortedCollections = useMemo(() => {
  const sorted = [...collections];
  switch (collectionSort) {
    case "recent":
      return sorted.sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      });
    case "name-asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "name-desc":
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    default:
      return sorted;
  }
}, [collections, collectionSort]);

  const totalFavorites = items.length + collections.length;

  return (
    <>
      <div className="flex sm:items-center justify-between flex-col sm:flex-row">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Star className="size-5 fill-yellow-400 text-yellow-400" />
            Favorites
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalFavorites} favorite{totalFavorites !== 1 ? "s" : ""} in your stash
          </p>
        </div>
        <div className="flex sm:items-center flex-col md:flex-row gap-4 mt-3 sm:mt-0">
          <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
            <span>Sort items:</span>
            <SortSelect value={itemSort} onValueChange={(v) => setItemSort(v as SortOption)} options={itemSortOptions} />
          </div>
          {collections.length > 0 && (
            <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
              <span>Sort collections:</span>
              <SortSelect
                value={collectionSort}
                onValueChange={(v) => setCollectionSort(v as SortOption)}
                options={collectionSortOptions}
              />
            </div>
          )}
        </div>
      </div>

      {totalFavorites === 0 ? (
        <div className="rounded-xl border bg-card/30 p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No favorites yet. Star your most‑used items and collections.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Collections Section */}
          {sortedCollections.length > 0 && (
            <section>
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <Folder className="size-4" />
                Collections
                <span className="text-xs text-muted-foreground/60">({sortedCollections.length})</span>
              </div>
              <div className="border rounded-lg divide-y divide-border/50 bg-muted/10">
                {sortedCollections.map((collection) => (
                  <CollectionRow key={collection.id} collection={collection} />
                ))}
              </div>
            </section>
          )}

          {/* Items Section */}
          {sortedItems.length > 0 && (
            <section>
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <Star className="size-4 fill-yellow-400 text-yellow-400" />
                Items
                <span className="text-xs text-muted-foreground/60">({sortedItems.length})</span>
              </div>
              <div className="border rounded-lg divide-y divide-border/50 bg-muted/10">
                {sortedItems.map((item) => (
                  <ItemRow key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}