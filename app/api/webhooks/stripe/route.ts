import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe/stripe';

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const customerId =
    typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id;
  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id;

  if (userId) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        isPro: true,
        ...(customerId ? { stripeCustomerId: customerId } : {}),
        ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
      },
    });
  } else if (customerId) {
    await prisma.user.updateMany({
      where: { stripeCustomerId: customerId },
      data: {
        isPro: true,
        ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
      },
    });
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId =
    typeof invoice.customer === 'string'
      ? invoice.customer
      : invoice.customer?.id;

  if (customerId) {
    await prisma.user.updateMany({
      where: { stripeCustomerId: customerId },
      data: { isPro: true },
    });
  }
}

function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId =
    typeof invoice.customer === 'string'
      ? invoice.customer
      : invoice.customer?.id;
  console.warn(
    `[Stripe Webhook] Payment failed for invoice ${invoice.id}, customer: ${customerId}`
  );
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer?.id;

  const isPro =
    subscription.status === 'active' || subscription.status === 'trialing';

  if (customerId) {
    await prisma.user.updateMany({
      where: { stripeCustomerId: customerId },
      data: {
        isPro,
        stripeSubscriptionId: subscription.id,
      },
    });
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer?.id;

  if (customerId) {
    await prisma.user.updateMany({
      where: { stripeCustomerId: customerId },
      data: {
        isPro: false,
        stripeSubscriptionId: null,
      },
    });
  }
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
      case 'checkout.session.completed':
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      default:
        // Unhandled event types are acknowledged safely
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Error processing webhook event ${event.type}:`, error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
