import {
  PaymentPlan,
  PaymentProvider,
  PaymentStatus,
  SubscriptionStatus,
} from '@/prisma/generated/prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * Paymob True Recurring Subscription Architecture (Phase 8)
 *
 * Current Paymob integration:
 * - One-time Intention flow with local 30/365-day entitlement.
 *
 * Target recurring integration (when Paymob recurring/MOTO capability is active on account):
 * - Subscription plans created in Paymob dashboard (monthly & yearly).
 * - Customer cards tokenized via Paymob saved card / recurring API.
 * - Paymob triggers recurring transaction webhooks.
 * - Local Subscription.providerSubscriptionId stores the Paymob subscription ID.
 * - Successful recurring charges record a Payment (PAID) and advance Subscription.currentPeriodEnd.
 */

export function mapPaymobRecurringStatus(status: string): SubscriptionStatus {
  switch (status.toLowerCase()) {
    case 'active':
    case 'success':
      return SubscriptionStatus.ACTIVE;
    case 'trialing':
      return SubscriptionStatus.TRIALING;
    case 'past_due':
    case 'unpaid':
      return SubscriptionStatus.PAST_DUE;
    case 'canceled':
    case 'cancelled':
      return SubscriptionStatus.CANCELED;
    default:
      return SubscriptionStatus.EXPIRED;
  }
}

export interface PaymobRecurringChargeInput {
  userId: string;
  paymobSubscriptionId: string;
  transactionId: string;
  orderId?: string;
  amount: number;
  currency: string;
  plan: PaymentPlan;
  success: boolean;
  periodStart: Date;
  periodEnd: Date;
}

/**
 * Handles incoming Paymob recurring charge callbacks.
 * Idempotently records the Payment and syncs Subscription lifecycle state.
 */
export async function handlePaymobRecurringCharge(input: PaymobRecurringChargeInput) {
  const {
    userId,
    paymobSubscriptionId,
    transactionId,
    orderId,
    amount,
    currency,
    plan,
    success,
    periodStart,
    periodEnd,
  } = input;

  const paymentStatus = success ? PaymentStatus.PAID : PaymentStatus.FAILED;

  return prisma.$transaction(async (tx) => {
    // 1. Idempotent payment record
    const payment = await tx.payment.upsert({
      where: {
        provider_providerTransactionId: {
          provider: PaymentProvider.PAYMOB,
          providerTransactionId: transactionId,
        },
      },
      create: {
        userId,
        provider: PaymentProvider.PAYMOB,
        plan,
        amount,
        currency,
        status: paymentStatus,
        providerTransactionId: transactionId,
        providerOrderId: orderId ?? null,
      },
      update: {
        status: paymentStatus,
        amount,
        currency,
        providerOrderId: orderId ?? null,
      },
    });

    // 2. Lifecycle updates only on successful payment or explicit provider status
    if (success) {
      await tx.subscription.upsert({
        where: {
          provider_providerSubscriptionId: {
            provider: PaymentProvider.PAYMOB,
            providerSubscriptionId: paymobSubscriptionId,
          },
        },
        create: {
          userId,
          provider: PaymentProvider.PAYMOB,
          plan,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          providerSubscriptionId: paymobSubscriptionId,
        },
        update: {
          plan,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { isPro: true },
      });
    }

    return payment;
  });
}
