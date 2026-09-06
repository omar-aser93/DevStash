import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PaymentPlan, PaymentProvider, SubscriptionStatus } from '@/prisma/generated/prisma/client';
import {
  migrateExistingStripeUser,
  migrateAllExistingStripeUsers,
  verifyBillingMigration,
} from './migration';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe/stripe';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    user: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    subscription: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock('@/lib/stripe/stripe', () => ({
  stripe: {
    subscriptions: {
      retrieve: vi.fn(),
    },
  },
}));

describe('Billing Migration (Phase 7)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockResolvedValue([] as never);
  });

  describe('migrateExistingStripeUser', () => {
    it('retrieves subscription from Stripe and upserts unified Subscription record', async () => {
      vi.mocked(stripe.subscriptions.retrieve).mockResolvedValue({
        id: 'sub_stripe_123',
        status: 'active',
        metadata: { plan: 'monthly' },
        items: {
          data: [
            {
              current_period_start: 1_700_000_000,
              current_period_end: 1_700_086_400,
            },
          ],
        },
      } as never);

      const result = await migrateExistingStripeUser({
        id: 'user-1',
        stripeSubscriptionId: 'sub_stripe_123',
      });

      expect(result.status).toBe('migrated');
      expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_stripe_123');
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.subscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            provider_providerSubscriptionId: {
              provider: PaymentProvider.STRIPE,
              providerSubscriptionId: 'sub_stripe_123',
            },
          },
          create: expect.objectContaining({
            userId: 'user-1',
            provider: PaymentProvider.STRIPE,
            plan: PaymentPlan.MONTHLY,
            status: SubscriptionStatus.ACTIVE,
          }),
        })
      );
    });

    it('handles Stripe API errors gracefully without throwing', async () => {
      vi.mocked(stripe.subscriptions.retrieve).mockRejectedValue(
        new Error('No such subscription: sub_missing')
      );

      const result = await migrateExistingStripeUser({
        id: 'user-2',
        stripeSubscriptionId: 'sub_missing',
      });

      expect(result.status).toBe('failed');
      expect(result.error).toContain('No such subscription');
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('migrateAllExistingStripeUsers', () => {
    it('iterates over all users with a stripeSubscriptionId', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([
        { id: 'user-1', stripeSubscriptionId: 'sub-1' },
        { id: 'user-2', stripeSubscriptionId: 'sub-2' },
      ] as never);

      vi.mocked(stripe.subscriptions.retrieve).mockResolvedValue({
        id: 'sub-1',
        status: 'active',
        metadata: { plan: 'yearly' },
        items: {
          data: [
            {
              current_period_start: 1_700_000_000,
              current_period_end: 1_700_086_400,
            },
          ],
        },
      } as never);

      const summary = await migrateAllExistingStripeUsers();
      expect(summary.total).toBe(2);
      expect(summary.migrated).toBe(2);
      expect(summary.failed).toBe(0);
    });
  });

  describe('verifyBillingMigration', () => {
    it('reports legacy vs active subscription matches and mismatches', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([
        {
          id: 'user-ok',
          email: 'ok@example.com',
          isPro: true,
          stripeSubscriptionId: 'sub-ok',
        },
        {
          id: 'user-mismatch',
          email: 'mismatch@example.com',
          isPro: true,
          stripeSubscriptionId: null,
        },
        {
          id: 'user-free',
          email: 'free@example.com',
          isPro: false,
          stripeSubscriptionId: null,
        },
      ] as never);

      vi.mocked(prisma.subscription.findFirst).mockImplementation(async ({ where }) => {
        if (where?.userId === 'user-ok') {
          return {
            id: 'sub-ok',
            userId: 'user-ok',
            status: SubscriptionStatus.ACTIVE,
          } as never;
        }
        return null;
      });

      const report = await verifyBillingMigration();
      expect(report.totalUsers).toBe(3);
      expect(report.legacyProUsers).toBe(2);
      expect(report.activeSubscriptionUsers).toBe(1);
      expect(report.mismatches).toHaveLength(1);
      expect(report.mismatches[0]).toEqual({
        userId: 'user-mismatch',
        email: 'mismatch@example.com',
        legacyIsPro: true,
        hasActiveSubscription: false,
        stripeSubscriptionId: null,
      });
    });
  });
});
