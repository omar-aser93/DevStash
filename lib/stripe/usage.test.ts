import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  MAX_ITEMS,
  MAX_COLLECTIONS,
  getUserUsage,
  canCreateItem,
  canCreateCollection,
} from './usage';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    item: {
      count: vi.fn(),
    },
    collection: {
      count: vi.fn(),
    },
  },
}));

describe('Stripe Usage Limit Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserUsage', () => {
    it('returns correct counts and canCreate booleans for free users under limit', async () => {
      vi.mocked(prisma.item.count).mockResolvedValue(10);
      vi.mocked(prisma.collection.count).mockResolvedValue(1);

      const usage = await getUserUsage('user-1', false);

      expect(usage).toEqual({
        itemCount: 10,
        collectionCount: 1,
        canCreateItem: true,
        canCreateCollection: true,
        maxItems: MAX_ITEMS,
        maxCollections: MAX_COLLECTIONS,
        isPro: false,
      });
      expect(prisma.item.count).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
      expect(prisma.collection.count).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    });

    it('sets canCreateItem: false at exactly MAX_ITEMS for free users', async () => {
      vi.mocked(prisma.item.count).mockResolvedValue(MAX_ITEMS);
      vi.mocked(prisma.collection.count).mockResolvedValue(1);

      const usage = await getUserUsage('user-1', false);

      expect(usage.itemCount).toBe(MAX_ITEMS);
      expect(usage.canCreateItem).toBe(false);
      expect(usage.canCreateCollection).toBe(true);
    });

    it('sets canCreateCollection: false at exactly MAX_COLLECTIONS for free users', async () => {
      vi.mocked(prisma.item.count).mockResolvedValue(20);
      vi.mocked(prisma.collection.count).mockResolvedValue(MAX_COLLECTIONS);

      const usage = await getUserUsage('user-1', false);

      expect(usage.collectionCount).toBe(MAX_COLLECTIONS);
      expect(usage.canCreateCollection).toBe(false);
      expect(usage.canCreateItem).toBe(true);
    });

    it('returns canCreateItem: true and canCreateCollection: true for Pro users even when over limit', async () => {
      vi.mocked(prisma.item.count).mockResolvedValue(100);
      vi.mocked(prisma.collection.count).mockResolvedValue(10);

      const usage = await getUserUsage('user-pro', true);

      expect(usage.itemCount).toBe(100);
      expect(usage.collectionCount).toBe(10);
      expect(usage.canCreateItem).toBe(true);
      expect(usage.canCreateCollection).toBe(true);
      expect(usage.isPro).toBe(true);
    });
  });

  describe('canCreateItem', () => {
    it('returns true when free user is under limit', async () => {
      vi.mocked(prisma.item.count).mockResolvedValue(MAX_ITEMS - 1);

      const result = await canCreateItem('user-1', false);

      expect(result).toBe(true);
      expect(prisma.item.count).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    });

    it('returns false when free user is at limit', async () => {
      vi.mocked(prisma.item.count).mockResolvedValue(MAX_ITEMS);

      const result = await canCreateItem('user-1', false);

      expect(result).toBe(false);
      expect(prisma.item.count).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    });

    it('returns false when free user is above limit', async () => {
      vi.mocked(prisma.item.count).mockResolvedValue(MAX_ITEMS + 5);

      const result = await canCreateItem('user-1', false);

      expect(result).toBe(false);
    });

    it('bypasses item limits for Pro users without querying database', async () => {
      const result = await canCreateItem('user-pro', true);

      expect(result).toBe(true);
      expect(prisma.item.count).not.toHaveBeenCalled();
    });
  });

  describe('canCreateCollection', () => {
    it('returns true when free user is under limit', async () => {
      vi.mocked(prisma.collection.count).mockResolvedValue(MAX_COLLECTIONS - 1);

      const result = await canCreateCollection('user-1', false);

      expect(result).toBe(true);
      expect(prisma.collection.count).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    });

    it('returns false when free user is at limit', async () => {
      vi.mocked(prisma.collection.count).mockResolvedValue(MAX_COLLECTIONS);

      const result = await canCreateCollection('user-1', false);

      expect(result).toBe(false);
      expect(prisma.collection.count).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    });

    it('returns false when free user is above limit', async () => {
      vi.mocked(prisma.collection.count).mockResolvedValue(MAX_COLLECTIONS + 2);

      const result = await canCreateCollection('user-1', false);

      expect(result).toBe(false);
    });

    it('bypasses collection limits for Pro users without querying database', async () => {
      const result = await canCreateCollection('user-pro', true);

      expect(result).toBe(true);
      expect(prisma.collection.count).not.toHaveBeenCalled();
    });
  });
});
