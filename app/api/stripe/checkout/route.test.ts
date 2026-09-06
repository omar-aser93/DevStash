import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe/stripe';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({ prisma: { user: { findUnique: vi.fn(), update: vi.fn() } } }));
vi.mock('@/lib/stripe/stripe', () => ({
  stripe: {
    customers: { create: vi.fn(), retrieve: vi.fn() },
    checkout: { sessions: { create: vi.fn() } },
  },
}));

describe('Stripe Checkout Route', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.STRIPE_PRICE_ID_MONTHLY = 'price_monthly';
    process.env.AUTH_URL = 'http://localhost:3000';
    const { auth } = await import('@/lib/auth');
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-abc', email: 'user@example.com' } } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-abc', email: 'user@example.com', name: null, stripeCustomerId: null } as never);
    vi.mocked(stripe.customers.create).mockResolvedValue({ id: 'cus_123' } as never);
    vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({ url: 'https://checkout.stripe.test/session' } as never);
  });

  it('stores the server-validated plan in checkout and subscription metadata', async () => {
    const response = await POST(new Request('http://localhost/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan: 'monthly' }),
    }));

    expect(response.status).toBe(200);
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(expect.objectContaining({
      metadata: { userId: 'user-abc', plan: 'monthly' },
      subscription_data: { metadata: { userId: 'user-abc', plan: 'monthly' } },
    }));
  });
});
