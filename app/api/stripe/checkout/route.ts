import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe/stripe';


export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { plan?: string } | null = null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const plan = body?.plan;
  if (plan !== 'monthly' && plan !== 'yearly') {
    return NextResponse.json(
      { error: 'Invalid plan. Must be "monthly" or "yearly".' },
      { status: 400 }
    );
  }

  const priceId =
    plan === 'monthly'
      ? process.env.STRIPE_PRICE_ID_MONTHLY
      : process.env.STRIPE_PRICE_ID_YEARLY;

  if (!priceId) {
    console.error(`Missing price ID for plan "${plan}"`);
    return NextResponse.json(
      { error: 'Subscription plan pricing is not configured on the server.' },
      { status: 500 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      stripeCustomerId: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }


  try {
    let customerId = user.stripeCustomerId;

    // Verify existing Stripe customer
    if (customerId) {
      try {
        const customer = await stripe.customers.retrieve(customerId);

        // Customer exists but was deleted
        if (customer.deleted) {
          customerId = null;
        }
      } catch (err: unknown) {
        if (
          typeof err === 'object' &&
          err !== null &&
          'code' in err &&
          err.code === 'resource_missing'
        ) {
          console.warn(
            `Stripe customer ${customerId} does not exist. Creating a new customer.`
          );

          customerId = null;
        } else {
          throw err;
        }
      }
    }

    // Create a new Stripe customer if needed
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });

      customerId = customer.id;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          stripeCustomerId: customerId,
        },
      });
    }

    const origin =
      request.headers.get('origin') ||
      process.env.AUTH_URL ||
      'http://localhost:3000';

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/dashboard/settings?upgraded=true`,
      cancel_url: `${origin}/dashboard/settings`,
      metadata: {
        userId: user.id,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
        },
      },
    });

    if (!checkoutSession.url) {
      return NextResponse.json(
        { error: 'Failed to create checkout session URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);

    return NextResponse.json(
      { error: 'Failed to initiate checkout session' },
      { status: 500 }
    );
  }
}