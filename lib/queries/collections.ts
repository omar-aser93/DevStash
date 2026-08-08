import "server-only";
import { prisma } from "@/lib/prisma";
import { cache } from "react";

export interface CollectionItemType {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface CollectionWithMeta {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  itemCount: number;
  containedTypes: CollectionItemType[];
  dominantColor: string;
}

const DEFAULT_COLOR = "#6b7280";

/**
 * Fetches a user's most recently updated collections, including a count of
 * contained items, the distinct item types represented, and the color of
 * whichever item type is most common in that collection (used for the card's
 * accent border).
 */
export async function getRecentCollections(
  userId: string,
  limit = 6
): Promise<CollectionWithMeta[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      items: {
        include: {
          item: {
            include: { itemType: true },
          },
        },
      },
    },
  });

  return collections.map((collection) => {
    const items = collection.items.map((itemCollection) => itemCollection.item);

    // Tally item types to find the dominant one for this collection.
    const typeCounts = new Map<
      string,
      { count: number; type: CollectionItemType }
    >();
    items.forEach((item) => {
      const key = item.itemType.id;
      const existing = typeCounts.get(key);
      typeCounts.set(key, {
        count: (existing?.count ?? 0) + 1,
        type: {
          id: item.itemType.id,
          name: item.itemType.name,
          icon: item.itemType.icon,
          color: item.itemType.color,
        },
      });
    });

    let dominantColor = DEFAULT_COLOR;
    let maxCount = 0;
    typeCounts.forEach(({ count, type }) => {
      if (count > maxCount) {
        maxCount = count;
        dominantColor = type.color;
      }
    });

    const containedTypes = Array.from(typeCounts.values()).map((v) => v.type);

    return {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      isFavorite: collection.isFavorite,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
      itemCount: items.length,
      containedTypes,
      dominantColor,
    };
  });
}

/** Stats used by the dashboard's top-level stat cards. */
export async function getCollectionStats(userId: string) {
  const [totalCollections, favoriteCollectionsCount] = await Promise.all([
    prisma.collection.count({ where: { userId } }),
    prisma.collection.count({ where: { userId, isFavorite: true } }),
  ]);

  return { totalCollections, favoriteCollectionsCount };
}

export interface SidebarCollection {
  id: string;
  name: string;
}

/**
 * Lightweight collection lists for the sidebar: favorited collections, and the 3 most recently updated. No item counts or type breakdown needed here.
 * we use cache here because this will be called on more than one place on page load
 */
export const getSidebarCollections = cache(async (userId: string) : Promise<{ favorites: SidebarCollection[]; recent: SidebarCollection[] }> => {  
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, isFavorite: true },
  });

  const favorites = collections.filter((c) => c.isFavorite).map(({ id, name }) => ({ id, name }));
  const recent = collections.slice(0, 3).map(({ id, name }) => ({ id, name }));

  return { favorites, recent };
});