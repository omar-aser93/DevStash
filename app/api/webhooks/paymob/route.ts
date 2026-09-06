import { NextResponse } from "next/server";
import crypto from "crypto";
import { PaymentProvider, PaymentStatus, SubscriptionStatus } from "@/prisma/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type PaymobTransaction = {
  amount_cents?: number;
  created_at?: string;
  currency?: string;
  error_occured?: boolean;
  has_parent_transaction?: boolean;
  id?: number;
  integration_id?: number;
  is_3d_secure?: boolean;
  is_auth?: boolean;
  is_capture?: boolean;
  is_refunded?: boolean;
  is_standalone_payment?: boolean;
  is_voided?: boolean;
  owner?: number;
  pending?: boolean;
  success?: boolean;
  order?: { id?: number; merchant_order_id?: string };
  source_data?: { pan?: string; sub_type?: string; type?: string };
};

export function verifyPaymobHmac(obj: PaymobTransaction, receivedHmac: string): boolean {
  const secret = process.env.PAYMOB_HMAC_SECRET;
  if (!secret) return false;
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
    obj.order?.id,
    obj.owner,
    obj.pending,
    obj.source_data?.pan,
    obj.source_data?.sub_type,
    obj.source_data?.type,
    obj.success,
  ];
  const payload = fields.map((value) => (value == null ? "" : String(value))).join("");
  const expected = crypto.createHmac("sha512", secret).update(payload).digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  try {
    const receivedBuf = Buffer.from(receivedHmac, "hex");
    if (expectedBuf.length !== receivedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(expectedBuf, receivedBuf);
  } catch {
    return false;
  }
}

export function calculatePaymobPeriodEnd(plan: "MONTHLY" | "YEARLY", start: Date): Date {
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + (plan === "MONTHLY" ? 30 : 365));
  return end;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { obj?: PaymobTransaction };
    const obj = body.obj;
    const hmac = new URL(request.url).searchParams.get("hmac");

    if (!obj || !hmac) {
      return NextResponse.json(
        { error: !obj ? "Invalid webhook payload" : "Missing HMAC" },
        { status: !obj ? 400 : 401 }
      );
    }

    if (!verifyPaymobHmac(obj, hmac)) {
      console.warn("[Paymob Webhook] Invalid HMAC signature");
      return NextResponse.json({ error: "Invalid HMAC" }, { status: 401 });
    }

    const merchantReference = obj.order?.merchant_order_id;
    if (!merchantReference) {
      return NextResponse.json({ error: "Missing merchant reference" }, { status: 400 });
    }

    const payment = await prisma.payment.findUnique({
      where: { merchantReference },
      select: { id: true, userId: true, plan: true, status: true },
    });

    if (!payment) {
      console.warn(`[Paymob Webhook] Payment not found for reference ${merchantReference}`);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (obj.success === true && obj.pending === false) {
      if (!obj.id) {
        return NextResponse.json({ error: "Missing transaction ID" }, { status: 400 });
      }

      const start = new Date();
      const periodEnd = calculatePaymobPeriodEnd(payment.plan, start);
      //const providerSubId = `paymob_sub_${payment.id}`;

      await prisma.$transaction(async (tx) => {
        const updated = await tx.payment.updateMany({
          where: { id: payment.id, status: PaymentStatus.PENDING },
          data: {
            status: PaymentStatus.PAID,
            providerTransactionId: String(obj.id),
            providerOrderId: obj.order?.id ? String(obj.order.id) : null,
          },
        });

        if (updated.count === 0) {
          // Already processed; avoid duplicate subscription
          return;
        }

        await tx.subscription.create({
          data: {
            userId: payment.userId,
            provider: PaymentProvider.PAYMOB,
            plan: payment.plan,
            status: SubscriptionStatus.ACTIVE,
            currentPeriodStart: start,
            currentPeriodEnd: periodEnd,
            providerSubscriptionId: null,
          },
        });

        await tx.user.update({
          where: { id: payment.userId },
          data: { isPro: true },
        });
      });

      console.log(
        `[Paymob Webhook] transaction=${obj.id} payment=${payment.id} status=PAID user=${payment.userId}`
      );
    } else if (
      obj.success === false &&
      obj.pending === false &&
      payment.status === PaymentStatus.PENDING
    ) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          ...(obj.id ? { providerTransactionId: String(obj.id) } : {}),
        },
      });

      console.log(
        `[Paymob Webhook] transaction=${obj.id ?? 'unknown'} payment=${payment.id} status=FAILED`
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Paymob Webhook] Processing failed:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
