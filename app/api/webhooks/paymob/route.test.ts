import { beforeEach, describe, expect, it, vi } from 'vitest';
import crypto from 'crypto';
import { PaymentPlan, PaymentProvider, PaymentStatus, SubscriptionStatus } from '@/prisma/generated/prisma/client';
import { POST } from './route';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    payment: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
    subscription: {
      create: vi.fn(),
    },
  },
}));

const TEST_HMAC_SECRET = 'test_paymob_hmac_secret';

function createHmacSignature(obj: Record<string, unknown>, secret: string): string {
  const fields = [
    obj.amount_cents,
    obj.created_at,
    obj.currency,
    obj.error_occured,
    obj.has_parent_transaction,
    obj.id,
    obj.integration_id,
    obj.is_3d_secure,
    obj.is_auth,
    obj.is_capture,
    obj.is_refunded,
    obj.is_standalone_payment,
    obj.is_voided,
    (obj.order as Record<string, unknown> | undefined)?.id,
    obj.owner,
    obj.pending,
    (obj.source_data as Record<string, unknown> | undefined)?.pan,
    (obj.source_data as Record<string, unknown> | undefined)?.sub_type,
    (obj.source_data as Record<string, unknown> | undefined)?.type,
    obj.success,
  ];
  const payload = fields.map((val) => (val == null ? '' : String(val))).join('');
  return crypto.createHmac('sha512', secret).update(payload).digest('hex');
}

function paymobRequest(bodyObj: Record<string, unknown>, customHmac?: string): Request {
  const hmac = customHmac ?? createHmacSignature(bodyObj, TEST_HMAC_SECRET);
  return new Request(`http://localhost:3000/api/webhooks/paymob?hmac=${hmac}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ obj: bodyObj }),
  });
}

describe('Paymob Webhook Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PAYMOB_HMAC_SECRET = TEST_HMAC_SECRET;
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      if (typeof callback === 'function') {
        return callback(prisma);
      }
      return callback;
    });
  });

  it('rejects missing payload or missing HMAC with 400 or 401', async () => {
    const missingHmac = new Request('http://localhost:3000/api/webhooks/paymob', {
      method: 'POST',
      body: JSON.stringify({ obj: {} }),
    });
    const res1 = await POST(missingHmac);
    expect(res1.status).toBe(401);

    const missingPayload = new Request('http://localhost:3000/api/webhooks/paymob?hmac=abc', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res2 = await POST(missingPayload);
    expect(res2.status).toBe(400);
  });

  it('rejects invalid HMAC with 401 and does not mutate database', async () => {
    const body = { id: 123, success: true, pending: false };
    const res = await POST(paymobRequest(body, 'invalid_hmac_hex_value'.padEnd(128, '0')));
    expect(res.status).toBe(401);
    expect(prisma.payment.findUnique).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('returns 404 when payment is not found for merchant reference', async () => {
    const body = {
      id: 999,
      success: true,
      pending: false,
      order: { id: 555, merchant_order_id: 'paymob_unknown' },
    };
    vi.mocked(prisma.payment.findUnique).mockResolvedValue(null);

    const res = await POST(paymobRequest(body));
    expect(res.status).toBe(404);
  });

  it('successfully processes a monthly payment, grants Pro, and creates 30-day subscription', async () => {
    const body = {
      id: 1001,
      success: true,
      pending: false,
      amount_cents: 40800,
      currency: 'EGP',
      order: { id: 2001, merchant_order_id: 'paymob_pay1' },
    };

    vi.mocked(prisma.payment.findUnique).mockResolvedValue({
      id: 'pay1',
      userId: 'user-1',
      plan: PaymentPlan.MONTHLY,
      status: PaymentStatus.PENDING,
    } as never);

    vi.mocked(prisma.payment.updateMany).mockResolvedValue({ count: 1 });

    const res = await POST(paymobRequest(body));
    expect(res.status).toBe(200);

    expect(prisma.payment.updateMany).toHaveBeenCalledWith({
      where: { id: 'pay1', status: PaymentStatus.PENDING },
      data: {
        status: PaymentStatus.PAID,
        providerTransactionId: '1001',
        providerOrderId: '2001',
      },
    });

    expect(prisma.subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          provider: PaymentProvider.PAYMOB,
          plan: PaymentPlan.MONTHLY,
          status: SubscriptionStatus.ACTIVE,
          providerSubscriptionId: null,
        }),
      })
    );

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { isPro: true },
    });
  });

  it('successfully processes a yearly payment and creates 365-day subscription', async () => {
    const body = {
      id: 1002,
      success: true,
      pending: false,
      amount_cents: 366900,
      currency: 'EGP',
      order: { id: 2002, merchant_order_id: 'paymob_pay2' },
    };

    vi.mocked(prisma.payment.findUnique).mockResolvedValue({
      id: 'pay2',
      userId: 'user-2',
      plan: PaymentPlan.YEARLY,
      status: PaymentStatus.PENDING,
    } as never);

    vi.mocked(prisma.payment.updateMany).mockResolvedValue({ count: 1 });

    const res = await POST(paymobRequest(body));
    expect(res.status).toBe(200);

    expect(prisma.subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-2',
          provider: PaymentProvider.PAYMOB,
          plan: PaymentPlan.YEARLY,
          status: SubscriptionStatus.ACTIVE,          
          providerSubscriptionId: null,
        }),
      })
    );
  });

  it('is idempotent on duplicate webhook: does not create duplicate subscription', async () => {
    const body = {
      id: 1003,
      success: true,
      pending: false,
      order: { id: 2003, merchant_order_id: 'paymob_dup' },
    };

    vi.mocked(prisma.payment.findUnique).mockResolvedValue({
      id: 'pay3',
      userId: 'user-3',
      plan: PaymentPlan.MONTHLY,
      status: PaymentStatus.PAID,
    } as never);

    // updateMany returns 0 because status is already PAID (not PENDING)
    vi.mocked(prisma.payment.updateMany).mockResolvedValue({ count: 0 });

    const res = await POST(paymobRequest(body));
    expect(res.status).toBe(200);
    expect(prisma.subscription.create).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('handles failed transaction by updating payment to FAILED without granting Pro', async () => {
    const body = {
      id: 1004,
      success: false,
      pending: false,
      order: { id: 2004, merchant_order_id: 'paymob_fail' },
    };

    vi.mocked(prisma.payment.findUnique).mockResolvedValue({
      id: 'pay4',
      userId: 'user-4',
      plan: PaymentPlan.MONTHLY,
      status: PaymentStatus.PENDING,
    } as never);

    const res = await POST(paymobRequest(body));
    expect(res.status).toBe(200);

    expect(prisma.payment.update).toHaveBeenCalledWith({
      where: { id: 'pay4' },
      data: {
        status: PaymentStatus.FAILED,
        providerTransactionId: '1004',
      },
    });
    expect(prisma.subscription.create).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
