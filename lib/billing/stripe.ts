import Stripe from 'stripe';
import {
  PaymentPlan,
  SubscriptionStatus,
} from '@/prisma/generated/prisma/client';

export function getStripeCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null
): string | null {
  return typeof customer === 'string' ? customer : customer?.id ?? null;
}

export function getStripeSubscriptionId(invoice: Stripe.Invoice): string | null {
  const subscription = invoice.parent?.subscription_details?.subscription;
  return typeof subscription === 'string' ? subscription : subscription?.id ?? null;
}

export function getStripePlan(subscription: Stripe.Subscription): PaymentPlan | null {
  const plan = subscription.metadata.plan;
  if (plan === 'monthly') return PaymentPlan.MONTHLY;
  if (plan === 'yearly') return PaymentPlan.YEARLY;

  // Legacy subscriptions may predate metadata. Only known server configuration
  // is used as a fallback; browser-provided values are never trusted.
  const priceId = subscription.items.data[0]?.price.id;
  if (priceId && priceId === process.env.STRIPE_PRICE_ID_MONTHLY) {
    return PaymentPlan.MONTHLY;
  }
  if (priceId && priceId === process.env.STRIPE_PRICE_ID_YEARLY) {
    return PaymentPlan.YEARLY;
  }

  return null;
}

export function getStripePeriod(subscription: Stripe.Subscription): {
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
} | null {
  const item = subscription.items.data[0];
  if (!item) return null;

  return {
    currentPeriodStart: new Date(item.current_period_start * 1000),
    currentPeriodEnd: new Date(item.current_period_end * 1000),
  };
}

export function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status
): SubscriptionStatus {
  switch (status) {
    case 'active':
      return SubscriptionStatus.ACTIVE;
    case 'trialing':
      return SubscriptionStatus.TRIALING;
    case 'past_due':
      return SubscriptionStatus.PAST_DUE;
    case 'canceled':
      return SubscriptionStatus.CANCELED;
    default:
      return SubscriptionStatus.EXPIRED;
  }
}

export function grantsProAccess(status: SubscriptionStatus): boolean {
  return status === SubscriptionStatus.ACTIVE || status === SubscriptionStatus.TRIALING;
}
