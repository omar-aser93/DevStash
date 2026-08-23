import "server-only";
import { prisma } from "@/lib/prisma";
import { cache } from "react";
import { ItemWithType, mapItem } from "@/lib/queries/items";

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

export interface CollectionWithItems {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  defaultTypeId: string | null;
  defaultType?: {
    id: string;
    name: string;
    icon: string;
    color: string;
  } | null;
  items: ItemWithType[]; // now full items
}

export interface SidebarCollection {
  id: string;
  name: string;
  updatedAt?: Date;
}

const DEFAULT_COLOR = "#6b7280";
const RECENT_COLLECTION_LIMIT = 6;
const COLLECTION_TYPE_SAMPLE_LIMIT = 24;
const SIDEBAR_FAVORITES_LIMIT = 6;
const SIDEBAR_RECENT_LIMIT = 3;
const COLLECTIONS_PER_PAGE = 21;


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
    take: Math.min(Math.max(limit, 1), RECENT_COLLECTION_LIMIT),
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { items: true } },
      items: {
        orderBy: { addedAt: "desc" },
        take: COLLECTION_TYPE_SAMPLE_LIMIT,
        select: {
          item: {
            select: {
              itemType: {
                select: { id: true, name: true, icon: true, color: true },
              },
            },
          },
        },
      },
    },
  });

  return collections.map((collection) => {
    // A bounded, newest-first sample supplies the card's visual type indicators;
    // the database count below remains exact for collections of any size.
    const typeCounts = new Map<
      string,
      { count: number; type: CollectionItemType }
    >();
    collection.items.forEach(({ item }) => {
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
      itemCount: collection._count.items,
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



/**
 * Lightweight collection lists for the sidebar: favorited collections, and the 3 most recently updated. No item counts or type breakdown needed here.
 * we use cache here because this will be called on more than one place on page load
 */
export const getSidebarCollections = cache(
  async (
    userId: string
  ): Promise<{ favorites: SidebarCollection[]; recent: SidebarCollection[] }> => {
    const collectionSelect = { id: true, name: true } as const;
    const [favorites, recent] = await Promise.all([
      prisma.collection.findMany({
        where: { userId, isFavorite: true },
        orderBy: { updatedAt: "desc" },
        take: SIDEBAR_FAVORITES_LIMIT,
        select: collectionSelect,
      }),
      prisma.collection.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: SIDEBAR_RECENT_LIMIT,
        select: collectionSelect,
      }),
    ]);

    return { favorites, recent };
  }
);



/** Fetch a single collection by ID with basic info (for drawer or edit) */
export async function getCollectionById(
  userId: string,
  collectionId: string
): Promise<CollectionWithItems | null> {
  const collection = await prisma.collection.findFirst({
    where: {
      id: collectionId,
      userId,
    },
    include: {
      defaultType: {
        select: {
          id: true,
          name: true,
          icon: true,
          color: true,
        },
      },
      items: {
        include: {
          item: {
            select: {
              id: true,
              title: true,
              description: true,
              contentType: true,
              isFavorite: true,
              isPinned: true,
              createdAt: true,
              updatedAt: true,
              language: true,
              fileUrl: true,
              fileName: true,
              fileSize: true,
              fileKey: true,
              url: true,
              content: true,
              itemType: {
                select: {
                  id: true,
                  name: true,
                  icon: true,
                  color: true,
                },
              },
              tags: {
                select: { name: true },
              },
            },
          },
        },
        orderBy: { addedAt: "desc" },
        take: 20,
      },
    },
  });

  if (!collection) return null;

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    isFavorite: collection.isFavorite,
    createdAt: collection.createdAt,
    updatedAt: collection.updatedAt,
    defaultTypeId: collection.defaultTypeId,
    defaultType: collection.defaultType,
    items: collection.items.map((ic) => ({
  id: ic.item.id,
  title: ic.item.title,
  description: ic.item.description,
  isFavorite: ic.item.isFavorite,
  isPinned: ic.item.isPinned,
  createdAt: ic.item.createdAt,
  updatedAt: ic.item.updatedAt,
  itemType: ic.item.itemType,
  tags: ic.item.tags.map((t) => t.name),
  fileUrl: ic.item.fileUrl,
  fileName: ic.item.fileName,
  fileSize: ic.item.fileSize,
  fileKey: ic.item.fileKey,
  contentType: ic.item.contentType,
  url: ic.item.url,
  content: ic.item.content,
  language: ic.item.language,
})),
  };
}



/** Get all collections (id, name) for a user, ordered by name. */
export async function getUserCollections(userId: string): Promise<SidebarCollection[]> {
  return prisma.collection.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}



/** Get all collections with full metadata (for the /collections page). */
export async function getAllCollectionsWithMeta(userId: string): Promise<CollectionWithMeta[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { items: true } },
      items: {
        orderBy: { addedAt: "desc" },
        take: COLLECTION_TYPE_SAMPLE_LIMIT,
        select: {
          item: {
            select: {
              itemType: {
                select: { id: true, name: true, icon: true, color: true },
              },
            },
          },
        },
      },
    },
  });

  // Same mapping logic as getRecentCollections – extract to a helper if you want to avoid duplication.
  return collections.map((collection) => {
    const typeCounts = new Map<string, { count: number; type: CollectionItemType }>();
    collection.items.forEach(({ item }) => {
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

    return {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      isFavorite: collection.isFavorite,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
      itemCount: collection._count.items,
      containedTypes: Array.from(typeCounts.values()).map((v) => v.type),
      dominantColor,
    };
  });
}



/** Get all collections with item count for search */
export async function getAllCollectionsWithCount(userId: string) {
  return prisma.collection.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      _count: {
        select: { items: true },
      },
    },
    orderBy: { name: "asc" },
  });
}



/** Get items in a collection with pagination. */
export async function getCollectionItems(
  userId: string,
  collectionId: string,
  page: number = 1,
  limit: number = COLLECTIONS_PER_PAGE
) {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where: {
        collections: { some: { collectionId } },
        userId,
      },
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
      skip,
      take: limit,
      include: {
        itemType: true,
        tags: true,
      },
    }),
    prisma.item.count({
      where: {
        collections: { some: { collectionId } },
        userId,
      },
    }),
  ]);

  // Map to ItemWithType using the existing mapItem function
  return {
    items: items.map(mapItem),
    total,
    totalPages: Math.ceil(total / limit),
  };
}



/** Get all favorited collections, ordered by most recently updated. */
export async function getFavoriteCollections(userId: string): Promise<SidebarCollection[]> {
  return prisma.collection.findMany({
    where: { userId, isFavorite: true },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, updatedAt: true },
  });
}