import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe/stripe';
import { PaymentProvider } from '@/prisma/generated/prisma/client';
import {
  getStripePeriod,
  getStripePlan,
  grantsProAccess,
  mapStripeSubscriptionStatus,
} from '@/lib/billing/stripe';
import { getActiveSubscription } from '@/lib/billing/entitlement';

export interface StripeMigrationResult {
  userId: string;
  stripeSubscriptionId: string;
  status: 'migrated' | 'skipped' | 'failed';
  error?: string;
}

export interface MigrationVerificationReport {
  totalUsers: number;
  legacyProUsers: number;
  activeSubscriptionUsers: number;
  mismatches: Array<{
    userId: string;
    email: string;
    legacyIsPro: boolean;
    hasActiveSubscription: boolean;
    stripeSubscriptionId: string | null;
  }>;
}

/**
 * Migrates a single existing Stripe subscriber to the unified Subscription model.
 * Inspects Stripe subscription status, period, and plan directly from Stripe.
 */
export async function migrateExistingStripeUser(user: {
  id: string;
  stripeSubscriptionId: string;
}): Promise<StripeMigrationResult> {
  try {
    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

    const plan = getStripePlan(subscription);
    const period = getStripePeriod(subscription);
    const status = mapStripeSubscriptionStatus(subscription.status);

    if (!plan || !period) {
      return {
        userId: user.id,
        stripeSubscriptionId: user.stripeSubscriptionId,
        status: 'failed',
        error: 'Missing plan or billing period details from Stripe.',
      };
    }

    await prisma.$transaction([
      prisma.subscription.upsert({
        where: {
          provider_providerSubscriptionId: {
            provider: PaymentProvider.STRIPE,
            providerSubscriptionId: subscription.id,
          },
        },
        create: {
          userId: user.id,
          provider: PaymentProvider.STRIPE,
          plan,
          status,
          ...period,
          providerSubscriptionId: subscription.id,
        },
        update: {
          plan,
          status,
          ...period,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          isPro: grantsProAccess(status),
        },
      }),
    ]);

    return {
      userId: user.id,
      stripeSubscriptionId: user.stripeSubscriptionId,
      status: 'migrated',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown Stripe error';
    return {
      userId: user.id,
      stripeSubscriptionId: user.stripeSubscriptionId,
      status: 'failed',
      error: message,
    };
  }
}

/**
 * Finds all users with a legacy stripeSubscriptionId and backfills
 * unified Subscription records from Stripe source of truth.
 */
export async function migrateAllExistingStripeUsers(): Promise<{
  total: number;
  migrated: number;
  failed: number;
  results: StripeMigrationResult[];
}> {
  const users = await prisma.user.findMany({
    where: {
      stripeSubscriptionId: {
        not: null,
      },
    },
    select: {
      id: true,
      stripeSubscriptionId: true,
    },
  });

  const results: StripeMigrationResult[] = [];

  for (const user of users) {
    if (!user.stripeSubscriptionId) continue;
    const res = await migrateExistingStripeUser({
      id: user.id,
      stripeSubscriptionId: user.stripeSubscriptionId,
    });
    results.push(res);
  }

  return {
    total: users.length,
    migrated: results.filter((r) => r.status === 'migrated').length,
    failed: results.filter((r) => r.status === 'failed').length,
    results,
  };
}

/**
 * Compares legacy User.isPro against current active Subscription entitlement.
 * Reports any discrepancy so that legacy fields can safely be cleaned up later.
 */
export async function verifyBillingMigration(): Promise<MigrationVerificationReport> {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      isPro: true,
      stripeSubscriptionId: true,
    },
  });

  const mismatches: MigrationVerificationReport['mismatches'] = [];
  let legacyProUsers = 0;
  let activeSubscriptionUsers = 0;

  for (const user of users) {
    if (user.isPro) legacyProUsers++;

    const activeSub = await getActiveSubscription(user.id);
    const hasActiveSub = !!activeSub;
    if (hasActiveSub) activeSubscriptionUsers++;

    if (user.isPro !== hasActiveSub) {
      mismatches.push({
        userId: user.id,
        email: user.email,
        legacyIsPro: user.isPro,
        hasActiveSubscription: hasActiveSub,
        stripeSubscriptionId: user.stripeSubscriptionId,
      });
    }
  }

  return {
    totalUsers: users.length,
    legacyProUsers,
    activeSubscriptionUsers,
    mismatches,
  };
}
