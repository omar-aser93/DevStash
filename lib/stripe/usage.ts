import { prisma } from '@/lib/prisma';
import { getEnvNumber } from '@/lib/utils';

// we set these in .env & used getEnvNumber() from lib/utils to convert to number
export const MAX_ITEMS = getEnvNumber("MAX_ITEMS", 50);
export const MAX_COLLECTIONS = getEnvNumber("MAX_COLLECTIONS", 5);

export interface UserUsage {
  itemCount: number;
  collectionCount: number;
  canCreateItem: boolean;
  canCreateCollection: boolean;
  maxItems: number;
  maxCollections: number;
  isPro: boolean;
}

/**
 * Returns item/collection counts and whether the user can create more items/collections.
 * Pro users bypass all free tier limits.
 */
export async function getUserUsage(userId: string, isPro: boolean = false): Promise<UserUsage> {
  const [itemCount, collectionCount] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.collection.count({ where: { userId } }),
  ]);

  return {
    itemCount,
    collectionCount,
    canCreateItem: isPro ? true : itemCount < MAX_ITEMS,
    canCreateCollection: isPro ? true : collectionCount < MAX_COLLECTIONS,
    maxItems: MAX_ITEMS,
    maxCollections: MAX_COLLECTIONS,
    isPro,
  };
}

/**
 * Quick boolean check if a user can create an item.
 * Pro users bypass limits immediately without querying the database.
 */
export async function canCreateItem(userId: string, isPro: boolean = false): Promise<boolean> {
  if (isPro) {
    return true;
  }
  const count = await prisma.item.count({ where: { userId } });
  return count < MAX_ITEMS;
}

/**
 * Quick boolean check if a user can create a collection.
 * Pro users bypass limits immediately without querying the database.
 */
export async function canCreateCollection(userId: string, isPro: boolean = false): Promise<boolean> {
  if (isPro) {
    return true;
  }
  const count = await prisma.collection.count({ where: { userId } });
  return count < MAX_COLLECTIONS;
}
