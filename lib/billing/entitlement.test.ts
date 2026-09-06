import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PaymentPlan, PaymentProvider, SubscriptionStatus } from '@/prisma/generated/prisma/client';
import { getActiveSubscription, getUserEntitlement, getUserSubscriptionDetails } from './entitlement';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    subscription: {
      findFirst: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Billing Entitlement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getActiveSubscription', () => {
    it('queries active and trialing subscriptions with future currentPeriodEnd', async () => {
      const mockSub = {
        id: 'sub-1',
        userId: 'user-1',
        provider: PaymentProvider.STRIPE,
        plan: PaymentPlan.MONTHLY,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date('2026-09-01'),
        currentPeriodEnd: new Date('2026-10-01'),
      };
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(mockSub as never);

      const result = await getActiveSubscription('user-1');
      expect(result).toEqual(mockSub);
      expect(prisma.subscription.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          status: {
            in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
          },
          currentPeriodEnd: {
            gt: expect.any(Date),
          },
        },
        orderBy: {
          currentPeriodEnd: 'desc',
        },
      });
    });

    it('returns null when no active subscription is found', async () => {
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null);

      const result = await getActiveSubscription('user-none');
      expect(result).toBeNull();
    });
  });

  describe('getUserEntitlement', () => {
    it('returns true when user has an active subscription', async () => {
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue({
        id: 'sub-1',
        userId: 'user-1',
        provider: PaymentProvider.PAYMOB,
        plan: PaymentPlan.MONTHLY,
        status: SubscriptionStatus.ACTIVE,
      } as never);

      const entitled = await getUserEntitlement('user-1');
      expect(entitled).toBe(true);
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('returns false when user has an expired subscription even if User.isPro is true', async () => {
      // First call (getActiveSubscription): no active subscription
      // Second call (hasSubscription check): finds the expired subscription record
      vi.mocked(prisma.subscription.findFirst)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'sub-expired' } as never);

      const entitled = await getUserEntitlement('user-expired-paymob');
      expect(entitled).toBe(false);
      // Legacy isPro fallback must NEVER be queried for users with billing records
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('returns false when user has a canceled subscription even if User.isPro is true', async () => {
      vi.mocked(prisma.subscription.findFirst)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'sub-canceled' } as never);

      const entitled = await getUserEntitlement('user-canceled-stripe');
      expect(entitled).toBe(false);
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('falls back to legacy User.isPro only if no subscription records exist', async () => {
      // Both active subscription and hasSubscription return null (no subscription rows at all)
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ isPro: true } as never);

      const entitled = await getUserEntitlement('user-legacy');
      expect(entitled).toBe(true);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-legacy' },
        select: { isPro: true },
      });
    });

    it('returns false when neither subscription nor legacy isPro exists', async () => {
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ isPro: false } as never);

      const entitled = await getUserEntitlement('user-free');
      expect(entitled).toBe(false);
    });

    it('returns false when user does not exist', async () => {
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const entitled = await getUserEntitlement('user-missing');
      expect(entitled).toBe(false);
    });
  });

  describe('getUserSubscriptionDetails', () => {
    it('returns active subscription details when available', async () => {
      const now = new Date();
      const future = new Date(Date.now() + 30 * 86400000);
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue({
        id: 'sub-1',
        userId: 'user-1',
        provider: PaymentProvider.STRIPE,
        plan: PaymentPlan.YEARLY,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: future,
      } as never);

      const details = await getUserSubscriptionDetails('user-1');
      expect(details).toEqual({
        hasActiveSubscription: true,
        provider: PaymentProvider.STRIPE,
        plan: PaymentPlan.YEARLY,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: future,
      });
    });

    it('returns isLegacyPro: false when user has subscription records that are no longer active', async () => {
      vi.mocked(prisma.subscription.findFirst)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'sub-expired' } as never);

      const details = await getUserSubscriptionDetails('user-expired');
      expect(details).toEqual({
        hasActiveSubscription: false,
        isLegacyPro: false,
        provider: null,
        plan: null,
        status: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
      });
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('returns legacy status when no subscription record exists at all', async () => {
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ isPro: true } as never);

      const details = await getUserSubscriptionDetails('user-legacy');
      expect(details).toEqual({
        hasActiveSubscription: false,
        isLegacyPro: true,
        provider: null,
        plan: null,
        status: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
      });
    });
  });
});
