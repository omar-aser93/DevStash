import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PaymentPlan, PaymentProvider, PaymentStatus, SubscriptionStatus } from '@/prisma/generated/prisma/client';
import { handlePaymobRecurringCharge, mapPaymobRecurringStatus } from './paymob';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    payment: {
      upsert: vi.fn(),
    },
    subscription: {
      upsert: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
  },
}));

describe('Paymob Recurring Integration (Phase 8)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      if (typeof callback === 'function') {
        return callback(prisma);
      }
      return callback;
    });
  });

  it('maps string statuses to prisma SubscriptionStatus', () => {
    expect(mapPaymobRecurringStatus('active')).toBe(SubscriptionStatus.ACTIVE);
    expect(mapPaymobRecurringStatus('success')).toBe(SubscriptionStatus.ACTIVE);
    expect(mapPaymobRecurringStatus('trialing')).toBe(SubscriptionStatus.TRIALING);
    expect(mapPaymobRecurringStatus('past_due')).toBe(SubscriptionStatus.PAST_DUE);
    expect(mapPaymobRecurringStatus('canceled')).toBe(SubscriptionStatus.CANCELED);
    expect(mapPaymobRecurringStatus('other')).toBe(SubscriptionStatus.EXPIRED);
  });

  it('records successful recurring charge and syncs subscription lifecycle', async () => {
    const start = new Date('2026-09-01');
    const end = new Date('2026-10-01');

    vi.mocked(prisma.payment.upsert).mockResolvedValue({ id: 'pay_rec_1' } as never);

    await handlePaymobRecurringCharge({
      userId: 'user-rec',
      paymobSubscriptionId: 'paymob_sub_999',
      transactionId: 'paymob_txn_888',
      orderId: 'paymob_ord_777',
      amount: 40800,
      currency: 'EGP',
      plan: PaymentPlan.MONTHLY,
      success: true,
      periodStart: start,
      periodEnd: end,
    });

    expect(prisma.payment.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          provider_providerTransactionId: {
            provider: PaymentProvider.PAYMOB,
            providerTransactionId: 'paymob_txn_888',
          },
        },
        create: expect.objectContaining({
          status: PaymentStatus.PAID,
          amount: 40800,
          currency: 'EGP',
        }),
      })
    );

    expect(prisma.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          provider_providerSubscriptionId: {
            provider: PaymentProvider.PAYMOB,
            providerSubscriptionId: 'paymob_sub_999',
          },
        },
        create: expect.objectContaining({
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: start,
          currentPeriodEnd: end,
        }),
      })
    );

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-rec' },
      data: { isPro: true },
    });
  });

  it('records failed recurring charge without cancelling subscription prematurely', async () => {
    const start = new Date('2026-09-01');
    const end = new Date('2026-10-01');

    await handlePaymobRecurringCharge({
      userId: 'user-rec',
      paymobSubscriptionId: 'paymob_sub_999',
      transactionId: 'paymob_txn_failed',
      amount: 40800,
      currency: 'EGP',
      plan: PaymentPlan.MONTHLY,
      success: false,
      periodStart: start,
      periodEnd: end,
    });

    expect(prisma.payment.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          status: PaymentStatus.FAILED,
        }),
      })
    );

    expect(prisma.subscription.upsert).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
