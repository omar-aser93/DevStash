import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PaymentPlan, PaymentProvider, PaymentStatus, SubscriptionStatus } from '@/prisma/generated/prisma/client';
import { POST } from './route';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe/stripe';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    user: { findUnique: vi.fn(), update: vi.fn() },
    subscription: { findUnique: vi.fn(), upsert: vi.fn() },
    payment: { upsert: vi.fn() },
  },
}));

vi.mock('@/lib/stripe/stripe', () => ({
  stripe: {
    webhooks: { constructEvent: vi.fn() },
    subscriptions: { retrieve: vi.fn() },
  },
}));

function webhookRequest(): Request {
  return new Request('http://localhost:3000/api/webhooks/stripe', {
    method: 'POST',
    headers: { 'stripe-signature': 'valid_sig' },
    body: 'payload',
  });
}

describe('Stripe Webhook Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
    vi.mocked(prisma.$transaction).mockResolvedValue([] as never);
  });

  it('rejects missing or invalid webhook signatures before mutations', async () => {
    const missingSignature = await POST(new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: '{}',
    }));
    expect(missingSignature.status).toBe(400);

    vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
      throw new Error('Invalid signature');
    });
    const invalidSignature = await POST(webhookRequest());
    expect(invalidSignature.status).toBe(400);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('links checkout records without granting Pro access', async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: { customer: 'cus_123', subscription: 'sub_123', metadata: { userId: 'user-abc' } } },
    } as never);

    const response = await POST(webhookRequest());
    expect(response.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-abc' },
      data: { stripeCustomerId: 'cus_123', stripeSubscriptionId: 'sub_123' },
    });
  });

  it('persists an active subscription using Stripe item billing dates', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-abc' } as never);
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_123', customer: 'cus_123', status: 'active', metadata: { userId: 'user-abc', plan: 'monthly' },
          items: { data: [{ current_period_start: 1_700_000_000, current_period_end: 1_700_086_400, price: { id: 'price_monthly' } }] },
        },
      },
    } as never);

    const response = await POST(webhookRequest());
    expect(response.status).toBe(200);
    expect(prisma.subscription.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        provider_providerSubscriptionId: {
          provider: PaymentProvider.STRIPE,
          providerSubscriptionId: 'sub_123',
        },
      },
      create: expect.objectContaining({
        provider: PaymentProvider.STRIPE,
        plan: PaymentPlan.MONTHLY,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(1_700_000_000_000),
        currentPeriodEnd: new Date(1_700_086_400_000),
      }),
    }));
  });

  it('upserts a paid invoice by its Stripe invoice ID', async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({ userId: 'user-abc', plan: PaymentPlan.YEARLY } as never);
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
      type: 'invoice.paid',
      data: {
        object: {
          id: 'in_123', amount_paid: 7200, amount_due: 7200, currency: 'usd',
          parent: { subscription_details: { subscription: 'sub_123' } },
        },
      },
    } as never);

    const response = await POST(webhookRequest());
    expect(response.status).toBe(200);
    expect(prisma.payment.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        provider_providerTransactionId: {
          provider: PaymentProvider.STRIPE,
          providerTransactionId: 'in_123',
        },
      },
      create: expect.objectContaining({
        provider: PaymentProvider.STRIPE,
        plan: PaymentPlan.YEARLY,
        amount: 7200,
        status: PaymentStatus.PAID,
      }),
    }));
  });

  it('records failed invoices without changing entitlement', async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({ userId: 'user-abc', plan: PaymentPlan.MONTHLY } as never);
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
      type: 'invoice.payment_failed',
      data: {
        object: {
          id: 'in_failed', amount_paid: 0, amount_due: 800, currency: 'usd',
          parent: { subscription_details: { subscription: 'sub_123' } },
        },
      },
    } as never);

    await POST(webhookRequest());
    expect(prisma.payment.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ status: PaymentStatus.FAILED, amount: 800 }),
    }));
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('cancels the local subscription and clears the legacy subscription ID', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-abc' } as never);
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_123', customer: 'cus_123', status: 'canceled', metadata: { userId: 'user-abc', plan: 'yearly' },
          items: { data: [{ current_period_start: 1_700_000_000, current_period_end: 1_700_086_400, price: { id: 'price_yearly' } }] },
        },
      },
    } as never);

    await POST(webhookRequest());
    expect(prisma.subscription.upsert).toHaveBeenCalledWith(expect.objectContaining({
      update: expect.objectContaining({ status: SubscriptionStatus.CANCELED }),
    }));
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ isPro: false, stripeSubscriptionId: null }),
    }));
  });

  it('handles a duplicate invoice event with the same provider key', async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({ userId: 'user-abc', plan: PaymentPlan.MONTHLY } as never);
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
      type: 'invoice.paid',
      data: { object: { id: 'in_duplicate', amount_paid: 800, amount_due: 800, currency: 'usd', parent: { subscription_details: { subscription: 'sub_123' } } } },
    } as never);

    await POST(webhookRequest());
    await POST(webhookRequest());
    expect(prisma.payment.upsert).toHaveBeenCalledTimes(2);
    expect(prisma.payment.upsert).toHaveBeenLastCalledWith(expect.objectContaining({
      where: {
        provider_providerTransactionId: {
          provider: PaymentProvider.STRIPE,
          providerTransactionId: 'in_duplicate',
        },
      },
    }));
  });
});
