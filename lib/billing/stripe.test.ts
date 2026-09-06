import { afterEach, describe, expect, it } from 'vitest';
import { PaymentPlan } from '@/prisma/generated/prisma/client';
import { getStripePlan, mapStripeSubscriptionStatus } from './stripe';

describe('Stripe billing helpers', () => {
  afterEach(() => {
    delete process.env.STRIPE_PRICE_ID_MONTHLY;
    delete process.env.STRIPE_PRICE_ID_YEARLY;
  });

  it('uses configured server price IDs only when legacy metadata is absent', () => {
    process.env.STRIPE_PRICE_ID_MONTHLY = 'price_monthly';
    const subscription = {
      metadata: {},
      items: { data: [{ price: { id: 'price_monthly' } }] },
    };

    expect(getStripePlan(subscription as never)).toBe(PaymentPlan.MONTHLY);
  });

  it('maps unknown non-entitled Stripe states to EXPIRED', () => {
    expect(mapStripeSubscriptionStatus('incomplete_expired')).toBe('EXPIRED');
  });
});
