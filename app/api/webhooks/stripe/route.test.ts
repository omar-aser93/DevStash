import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe/stripe';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/stripe/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}));

describe('Stripe Webhook Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
  });

  it('returns 400 if stripe-signature header is missing', async () => {
    const request = new Request('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Missing stripe-signature');
  });

  it('returns 400 if signature verification fails', async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const request = new Request('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'stripe-signature': 'invalid_sig',
      },
      body: 'payload',
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid signature');
  });

  it('handles checkout.session.completed event and marks user as Pro', async () => {
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_123',
          customer: 'cus_123',
          subscription: 'sub_123',
          metadata: {
            userId: 'user-abc',
          },
        },
      },
    };

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(
      mockEvent as never
    );

    const request = new Request('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'stripe-signature': 'valid_sig',
      },
      body: JSON.stringify(mockEvent),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.received).toBe(true);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-abc' },
      data: {
        isPro: true,
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
      },
    });
  });

  it('handles invoice.paid event and ensures isPro: true', async () => {
    const mockEvent = {
      type: 'invoice.paid',
      data: {
        object: {
          id: 'in_123',
          customer: 'cus_123',
        },
      },
    };

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(
      mockEvent as never
    );

    const request = new Request('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'stripe-signature': 'valid_sig',
      },
      body: JSON.stringify(mockEvent),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { stripeCustomerId: 'cus_123' },
      data: { isPro: true },
    });
  });

  it('handles customer.subscription.updated event (active status)', async () => {
    const mockEvent = {
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_123',
          customer: 'cus_123',
          status: 'active',
        },
      },
    };

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(
      mockEvent as never
    );

    const request = new Request('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'stripe-signature': 'valid_sig',
      },
      body: JSON.stringify(mockEvent),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { stripeCustomerId: 'cus_123' },
      data: {
        isPro: true,
        stripeSubscriptionId: 'sub_123',
      },
    });
  });

  it('handles customer.subscription.deleted event and sets isPro: false', async () => {
    const mockEvent = {
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_123',
          customer: 'cus_123',
        },
      },
    };

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(
      mockEvent as never
    );

    const request = new Request('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'stripe-signature': 'valid_sig',
      },
      body: JSON.stringify(mockEvent),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { stripeCustomerId: 'cus_123' },
      data: {
        isPro: false,
        stripeSubscriptionId: null,
      },
    });
  });
});
