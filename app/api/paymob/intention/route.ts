import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PAYMOB_SECRET_KEY = process.env.PAYMOB_SECRET_KEY!;
const PAYMOB_PUBLIC_KEY = process.env.PAYMOB_PUBLIC_KEY!;
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID!;

const PAYMOB_API_URL =
  process.env.PAYMOB_API_URL || "https://accept.paymob.com";

const PLANS = {
  monthly: {
    amount: 40800, // 408 EGP
    currency: "EGP",
  },
  yearly: {
    amount: 366900, // 3669 EGP
    currency: "EGP",
  },
} as const;

type Plan = keyof typeof PLANS;

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const plan = body?.plan as Plan;

  if (!plan || !(plan in PLANS)) {
    return NextResponse.json(
      { error: "Invalid plan" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    );
  }

  const selectedPlan = PLANS[plan];

  try {
    const merchantOrderId = `devstash_${user.id}_${Date.now()}`;

    const response = await fetch(
      `${PAYMOB_API_URL}/api/v1/intention/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${PAYMOB_SECRET_KEY}`,
        },
        body: JSON.stringify({
          amount: selectedPlan.amount,
          currency: selectedPlan.currency,

          payment_methods: [
            Number(PAYMOB_INTEGRATION_ID),
          ],

          special_reference: merchantOrderId,

          notification_url: `${process.env.AUTH_URL}/api/webhooks/paymob`,
          redirection_url: `${process.env.AUTH_URL}/dashboard/settings?upgraded=true`,

          items: [],

          billing_data: {
            email: user.email,
            first_name:
              user.name?.split(" ")[0] || "User",
            last_name:
              user.name?.split(" ").slice(1).join(" ") || "User",
            phone_number: "01000000000",
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Paymob error:", data);

      return NextResponse.json(
        {
          error: "Failed to create Paymob payment",
          details: data,
        },
        { status: 500 }
      );
    }

    const clientSecret = data.client_secret;

    if (!clientSecret) {
      throw new Error(
        "Paymob did not return a client_secret"
      );
    }

    const checkoutUrl =
      `${PAYMOB_API_URL}/unifiedcheckout/` +
      `?publicKey=${encodeURIComponent(PAYMOB_PUBLIC_KEY)}` +
      `&clientSecret=${encodeURIComponent(clientSecret)}`;

    return NextResponse.json({
      url: checkoutUrl,
    });
  } catch (error) {
    console.error("Paymob checkout error:", error);

    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}