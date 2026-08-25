import "server-only";
import { prisma } from "@/lib/prisma";
import { cache } from "react";
import { notFound } from "next/navigation";

export interface FullItem {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  contentType: string;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  fileKey: string | null;
  url: string | null;
  language: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  itemType: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
  tags: string[];
  collections: {
    id: string;
    name: string;
  }[];  
}


export interface ItemWithType {
  id: string;
  title: string;
  description: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  itemType: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
  tags: string[];
  // Optional file fields (only for file/image types)
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  fileKey?: string | null;
  contentType?: string ; // e.g., "FILE", "IMAGE" (we could also use item type name)
}

const itemInclude = {
  itemType: true,
  tags: true,
} as const;

interface RawItem {
  id: string;
  title: string;
  description: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  itemType: { id: string; name: string; icon: string; color: string };
  tags: { name: string }[];
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  fileKey: string | null;
  contentType: string ;
}

export function mapItem(item: RawItem): ItemWithType {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    itemType: {
      id: item.itemType.id,
      name: item.itemType.name,
      icon: item.itemType.icon,
      color: item.itemType.color,
    },
    tags: item.tags.map((tag) => tag.name),
    fileUrl: item.fileUrl ?? null,
    fileName: item.fileName ?? null,
    fileSize: item.fileSize ?? null,
    fileKey: item.fileKey ?? null,
    contentType: item.contentType ?? null,
  };
}

export interface ItemTypeWithCount {
  id: string;
  name: string;
  icon: string;
  color: string;
  itemCount: number;
}

const ITEMS_PER_PAGE = 21;


/** Pinned items for the dashboard's pinned-items section. */
export async function getPinnedItems(userId: string, limit = 4): Promise<ItemWithType[]> {
  const items = await prisma.item.findMany({
    where: { userId, isPinned: true },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: itemInclude,
  });

  return items.map(mapItem);
}



/** Most recently updated items for the dashboard's recent-items list. */
export async function getRecentItems(userId: string, limit = 10): Promise<ItemWithType[]> {
  const items = await prisma.item.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: itemInclude,
  });

  return items.map(mapItem);
}



/** Stats used by the dashboard's top-level stat cards. */
export async function getItemStats(userId: string) {
  const [totalItems, favoriteItemsCount] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.item.count({ where: { userId, isFavorite: true } }),
  ]);

  return { totalItems, favoriteItemsCount };
}



/**
 * All item types visible to a user (system types + any custom ones they've created), each annotated with how many of that user's items use it.
 * we use cache here because this will be called on more than one place on page load
 */
export const getItemTypesWithCounts = cache(async (userId: string): Promise<ItemTypeWithCount[]> => {  
  const [itemTypes, counts] = await Promise.all([
    prisma.itemType.findMany({
      where: { OR: [{ isSystem: true }, { userId }] },
      orderBy: { name: "desc" },
    }),
    prisma.item.groupBy({
      by: ["itemTypeId"],
      where: { userId },
      _count: { _all: true },
    }),
  ]);
 
  const countMap = new Map(counts.map((c) => [c.itemTypeId, c._count._all]));
 
  return itemTypes.map((type) => ({
    id: type.id,
    name: type.name,
    icon: type.icon,
    color: type.color,
    itemCount: countMap.get(type.id) ?? 0,
  }));
});



/** Items filtered by a specific item type (system or user-created) with pagination. */
export async function getItemsByType(
  userId: string,
  typeName: string,
  page: number = 1,
  limit: number = ITEMS_PER_PAGE
) {
  const itemType = await prisma.itemType.findFirst({
    where: {
      name: typeName,
      OR: [{ isSystem: true }, { userId }],
    },
  });

  if (!itemType) {
    notFound();
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where: { userId, itemTypeId: itemType.id },
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
      skip,
      take: limit,
      include: itemInclude,
    }),
    prisma.item.count({ where: { userId, itemTypeId: itemType.id } }),
  ]);

  return {
    items: items.map(mapItem),
    type: itemType,
    total,
    totalPages: Math.ceil(total / limit),
  };
}


/** Fetch a single item by ID with all relations (for the drawer) */
export async function getItemById(
  userId: string,
  itemId: string
): Promise<FullItem | null> {
  const item = await prisma.item.findFirst({
    where: {
      id: itemId,
      userId: userId,
    },
    include: {
      itemType: true,
      tags: true,
      collections: {
        include: {
          collection: true,
        },
      },
    },
  });

  if (!item) return null;

  return {
    id: item.id,
    title: item.title,
    description: item.description,
    content: item.content,
    contentType: item.contentType,
    fileUrl: item.fileUrl,
    fileName: item.fileName,
    fileSize: item.fileSize,
    fileKey: item.fileKey,
    url: item.url,
    language: item.language,
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    itemType: {
      id: item.itemType.id,
      name: item.itemType.name,
      icon: item.itemType.icon,
      color: item.itemType.color,
    },
    tags: item.tags.map((tag) => tag.name),
    collections: item.collections.map((ic) => ({
      id: ic.collection.id,
      name: ic.collection.name,
    })),
  };
}



/** Get all items with minimal fields for search (title, content preview, type) */
export async function getAllItemsForSearch(userId: string) {
  const items = await prisma.item.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      content: true,
      itemType: {
        select: {
          id: true,
          name: true,
          icon: true,
          color: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    content: item.content?.slice(0, 150) ?? "",
    itemType: {
      id: item.itemType.id,
      name: item.itemType.name,
      icon: item.itemType.icon,
      color: item.itemType.color,
    },
  }));
}



/** Get all favorited items, ordered by most recently updated. */
export async function getFavoriteItems(userId: string): Promise<ItemWithType[]> {
  const items = await prisma.item.findMany({
    where: { userId, isFavorite: true },
    orderBy: { updatedAt: "desc" },
    include: itemInclude,
  });
  return items.map(mapItem);
}



/** Get items filtered by a tag (user-owned) with pagination. */
export async function getItemsByTag(
  userId: string,
  tagName: string,
  page: number = 1,
  limit: number = ITEMS_PER_PAGE
) {
  const tag = await prisma.tag.findFirst({
    where: {
      name: tagName,
      userId,
    },
  });

  if (!tag) {
    notFound();
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where: {
        userId,
        tags: { some: { id: tag.id } },
      },
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
      skip,
      take: limit,
      include: itemInclude,
    }),
    prisma.item.count({
      where: {
        userId,
        tags: { some: { id: tag.id } },
      },
    }),
  ]);

  return {
    items: items.map(mapItem),
    tag,
    total,
    totalPages: Math.ceil(total / limit),
  };
}