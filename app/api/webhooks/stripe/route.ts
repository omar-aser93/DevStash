import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PaymentProvider, PaymentStatus } from '@/prisma/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe/stripe';
import {
  getStripeCustomerId,
  getStripePeriod,
  getStripePlan,
  getStripeSubscriptionId,
  grantsProAccess,
  mapStripeSubscriptionStatus,
} from '@/lib/billing/stripe';

async function findUserId(subscription: Stripe.Subscription): Promise<string | null> {
  const metadataUserId = subscription.metadata.userId;
  if (metadataUserId) {
    const user = await prisma.user.findUnique({
      where: { id: metadataUserId },
      select: { id: true },
    });
    if (user) return user.id;
  }

  const customerId = getStripeCustomerId(subscription.customer);
  if (!customerId) return null;

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });
  return user?.id ?? null;
}

async function synchronizeSubscription(subscription: Stripe.Subscription) {
  const userId = await findUserId(subscription);
  const plan = getStripePlan(subscription);
  const period = getStripePeriod(subscription);
  const customerId = getStripeCustomerId(subscription.customer);

  if (!userId || !plan || !period) {
    console.warn(
      `[Stripe Webhook] Subscription ${subscription.id} was not synchronized: missing user, plan, or billing period.`
    );
    return null;
  }

  const status = mapStripeSubscriptionStatus(subscription.status);
  const isDeleted = subscription.status === 'canceled';

  await prisma.$transaction([
    prisma.subscription.upsert({
      where: {
        provider_providerSubscriptionId: {
          provider: PaymentProvider.STRIPE,
          providerSubscriptionId: subscription.id,
        },
      },
      create: {
        userId,
        provider: PaymentProvider.STRIPE,
        plan,
        status,
        ...period,
        providerSubscriptionId: subscription.id,
      },
      update: { plan, status, ...period },
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        isPro: isDeleted ? false : grantsProAccess(status),
        ...(customerId ? { stripeCustomerId: customerId } : {}),
        stripeSubscriptionId: isDeleted ? null : subscription.id,
      },
    }),
  ]);

  return { userId, plan };
}

async function ensureSubscriptionForInvoice(invoice: Stripe.Invoice) {
  const subscriptionId = getStripeSubscriptionId(invoice);
  if (!subscriptionId) return null;

  let subscription = await prisma.subscription.findUnique({
    where: {
      provider_providerSubscriptionId: {
        provider: PaymentProvider.STRIPE,
        providerSubscriptionId: subscriptionId,
      },
    },
    select: { userId: true, plan: true },
  });

  if (!subscription) {
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    await synchronizeSubscription(stripeSubscription);
    subscription = await prisma.subscription.findUnique({
      where: {
        provider_providerSubscriptionId: {
          provider: PaymentProvider.STRIPE,
          providerSubscriptionId: subscriptionId,
        },
      },
      select: { userId: true, plan: true },
    });
  }

  return subscription ? { ...subscription, subscriptionId } : null;
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const customerId = getStripeCustomerId(session.customer);
  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id;

  if (userId) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(customerId ? { stripeCustomerId: customerId } : {}),
        ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
      },
    });
  }
}

async function upsertInvoicePayment(invoice: Stripe.Invoice, status: PaymentStatus) {
  const subscription = await ensureSubscriptionForInvoice(invoice);
  if (!subscription) {
    console.warn(`[Stripe Webhook] Invoice ${invoice.id} has no synchronized subscription.`);
    return;
  }

  await prisma.payment.upsert({
    where: {
      provider_providerTransactionId: {
        provider: PaymentProvider.STRIPE,
        providerTransactionId: invoice.id,
      },
    },
    create: {
      userId: subscription.userId,
      provider: PaymentProvider.STRIPE,
      plan: subscription.plan,
      amount: status === PaymentStatus.PAID ? invoice.amount_paid : invoice.amount_due,
      currency: invoice.currency,
      status,
      providerTransactionId: invoice.id,
      providerOrderId: subscription.subscriptionId,
    },
    update: {
      amount: status === PaymentStatus.PAID ? invoice.amount_paid : invoice.amount_due,
      currency: invoice.currency,
      status,
      providerOrderId: subscription.subscriptionId,
    },
  });
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header or STRIPE_WEBHOOK_SECRET' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`[Stripe Webhook] event=checkout.session.completed session=${session.id}`);
        await handleCheckoutCompleted(session);
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[Stripe Webhook] event=invoice.paid invoice=${invoice.id}`);
        await upsertInvoicePayment(invoice, PaymentStatus.PAID);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[Stripe Webhook] event=invoice.payment_failed invoice=${invoice.id}`);
        await upsertInvoicePayment(invoice, PaymentStatus.FAILED);
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[Stripe Webhook] event=${event.type} subscription=${subscription.id}`);
        await synchronizeSubscription(subscription);
        break;
      }
      default:
        break;
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Error processing webhook event ${event.type}:`, error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
