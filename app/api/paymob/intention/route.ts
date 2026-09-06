import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PaymentPlan, PaymentProvider, PaymentStatus } from "@/prisma/generated/prisma/client";

const PAYMOB_SECRET_KEY = process.env.PAYMOB_SECRET_KEY!;
const PAYMOB_PUBLIC_KEY = process.env.PAYMOB_PUBLIC_KEY!;
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID!;

// Ensure the URL ends with /api
const PAYMOB_API_URL =
  process.env.PAYMOB_API_URL?.replace(/\/$/, "") || "https://accept.paymob.com/api";

const PLANS = {
  monthly: { amount: 40800, currency: "EGP" },
  yearly: { amount: 366900, currency: "EGP" },
} as const;

type Plan = keyof typeof PLANS;

const PAYMENT_PLANS: Record<Plan, PaymentPlan> = {
  monthly: PaymentPlan.MONTHLY,
  yearly: PaymentPlan.YEARLY,
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const plan = body?.plan as Plan;
  if (!plan || !(plan in PLANS)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const selectedPlan = PLANS[plan];
  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      provider: PaymentProvider.PAYMOB,
      plan: PAYMENT_PLANS[plan],
      amount: selectedPlan.amount,
      currency: selectedPlan.currency,
      status: PaymentStatus.PENDING,
    },
    select: { id: true },
  });
  const merchantReference = `paymob_${payment.id}`;
  await prisma.payment.update({
    where: { id: payment.id },
    data: { merchantReference },
  });

  try {
    const url = `${PAYMOB_API_URL}/v1/intention/`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${PAYMOB_SECRET_KEY}`,
      },
      body: JSON.stringify({
        amount: selectedPlan.amount,
        currency: selectedPlan.currency,
        payment_methods: [Number(PAYMOB_INTEGRATION_ID)],
        special_reference: merchantReference,
        notification_url: `${process.env.AUTH_URL}/api/webhooks/paymob`,
        redirection_url: `${process.env.AUTH_URL}/dashboard/settings?upgraded=true`,
        items: [],
        billing_data: {
          email: user.email,
          first_name: user.name?.split(" ")[0] || "User",
          last_name: user.name?.split(" ").slice(1).join(" ") || "User",
          phone_number: "01000000000",
        },
      }),
    });

    const text = await response.text();

    if (!response.ok) {
      console.error("[Paymob Intention] Provider request failed", {
        status: response.status,
      });
      return NextResponse.json(
        {
          error: "Failed to create Paymob payment",
        },
        { status: response.status }
      );
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        {
          error: "Paymob returned invalid JSON",
        },
        { status: 500 }
      );
    }

    const clientSecret = data.client_secret;
    if (!clientSecret) {
      throw new Error("Paymob did not return a client_secret");
    }

    const checkoutUrl =
      `${PAYMOB_API_URL}/unifiedcheckout/` +
      `?publicKey=${encodeURIComponent(PAYMOB_PUBLIC_KEY)}` +
      `&clientSecret=${encodeURIComponent(clientSecret)}`;

    return NextResponse.json({ url: checkoutUrl });
  } catch {
    console.error("[Paymob Intention] Request failed");
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}
