import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET!;

type PaymobTransaction = {
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

  order?: {
    id?: number;
    merchant_order_id?: string;
  };

  source_data?: {
    pan?: string;
    sub_type?: string;
    type?: string;
  };
};

type PaymobWebhookBody = {
  type?: string;
  obj?: PaymobTransaction;
};

function verifyHmac(
  obj: PaymobTransaction,
  receivedHmac: string
): boolean {
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

  const hmacString = fields
    .map((value) => {
      if (value === undefined || value === null) {
        return "";
      }

      if (typeof value === "boolean") {
        return value ? "true" : "false";
      }

      return String(value);
    })
    .join("");

  const calculatedHmac = crypto
    .createHmac("sha512", HMAC_SECRET)
    .update(hmacString)
    .digest("hex");

  if (calculatedHmac.length !== receivedHmac.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(calculatedHmac, "hex"),
    Buffer.from(receivedHmac, "hex")
  );
}

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as PaymobWebhookBody;

    const obj = body.obj;

    if (!obj) {
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    // Paymob sends HMAC as a query parameter.
    const url = new URL(request.url);
    const receivedHmac = url.searchParams.get("hmac");

    if (!receivedHmac) {
      return NextResponse.json(
        { error: "Missing HMAC" },
        { status: 401 }
      );
    }

    if (!verifyHmac(obj, receivedHmac)) {
      return NextResponse.json(
        { error: "Invalid HMAC" },
        { status: 401 }
      );
    }

    // HMAC is valid from this point onward.

    const merchantOrderId =
      obj.order?.merchant_order_id;

    if (!merchantOrderId) {
      return NextResponse.json(
        { error: "Missing merchant order ID" },
        { status: 400 }
      );
    }

    const parts = merchantOrderId.split("_");

    // devstash_USER_ID_TIMESTAMP
    const userId = parts[1];

    if (!userId) {
      return NextResponse.json(
        { error: "Invalid merchant order ID" },
        { status: 400 }
      );
    }

    if (obj.success === true && obj.pending === false) {
      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          isPro: true,
        },
      });
    }

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error("Paymob webhook error:", error);

    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}