import { prisma } from '@/lib/prisma';
import { SubscriptionStatus } from '@/prisma/generated/prisma/client';

/**
 * Returns the currently active and non-expired subscription for a user.
 * Supports both Stripe (provider-managed periods) and Paymob (time-limited local entitlement).
 */
export async function getActiveSubscription(userId: string) {
  return prisma.subscription.findFirst({
    where: {
      userId,
      status: {
        in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
      },
      currentPeriodEnd: {
        gt: new Date(),
      },
    },
    orderBy: {
      currentPeriodEnd: 'desc',
    },
  });
}

/**
 * Unified entitlement check for application access and feature gating.
 * Sources from active Subscription records.
 *
 * Scoped migration fallback:
 * If the user has any Subscription records (e.g. expired Paymob or canceled Stripe),
 * their entitlement is managed by the subscription lifecycle and definitively false.
 * Only legacy users with NO subscription records fall back to User.isPro.
 */
export async function getUserEntitlement(userId: string): Promise<boolean> {
  const activeSubscription = await getActiveSubscription(userId);
  if (activeSubscription) {
    return true;
  }

  // If the user already has a subscription record, never let legacy isPro override it
  const hasSubscription = await prisma.subscription.findFirst({
    where: { userId },
    select: { id: true },
  });

  if (hasSubscription) {
    return false;
  }

  // Temporary migration fallback only for legacy users without any subscription records
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPro: true },
  });

  return user?.isPro ?? false;
}

/**
 * Returns detailed active subscription metadata for UI and account management.
 */
export async function getUserSubscriptionDetails(userId: string) {
  const activeSubscription = await getActiveSubscription(userId);
  if (activeSubscription) {
    return {
      hasActiveSubscription: true,
      provider: activeSubscription.provider,
      plan: activeSubscription.plan,
      status: activeSubscription.status,
      currentPeriodStart: activeSubscription.currentPeriodStart,
      currentPeriodEnd: activeSubscription.currentPeriodEnd,
    };
  }

  const hasSubscription = await prisma.subscription.findFirst({
    where: { userId },
    select: { id: true },
  });

  if (hasSubscription) {
    return {
      hasActiveSubscription: false,
      isLegacyPro: false,
      provider: null,
      plan: null,
      status: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPro: true },
  });

  return {
    hasActiveSubscription: false,
    isLegacyPro: user?.isPro ?? false,
    provider: null,
    plan: null,
    status: null,
    currentPeriodStart: null,
    currentPeriodEnd: null,
  };
}
