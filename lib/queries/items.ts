import "server-only";
import { prisma } from "@/lib/prisma";
import { cache } from "react";

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
}

function mapItem(item: RawItem): ItemWithType {
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
  };
}

export interface ItemTypeWithCount {
  id: string;
  name: string;
  icon: string;
  color: string;
  itemCount: number;
}


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
      orderBy: { name: "asc" },
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