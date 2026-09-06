# Paymob Integration - Phase 1 & Phase 2 Specification

## Overview

Integrate Paymob as the regional payment provider for DevStash,
alongside the existing Stripe integration.

Paymob will currently use the **Intention API + Unified Checkout** flow.
The existing Test integration is:

-   Integration ID: `5883890`
-   Currency: `EGP`
-   Channel: `online`
-   Type: `Non-Shopify`
-   Payment method: `VPC`

Current Paymob pricing:

  Plan      Paymob Price
  --------- --------------
  Monthly   408 EGP
  Yearly    3669 EGP

Amounts sent to Paymob must use the smallest currency unit:

  Plan      API Amount
  --------- ------------
  Monthly   `40800`
  Yearly    `366900`

The current implementation successfully completes a Test payment on
Vercel and receives a `POST 200` callback at `/api/webhooks/paymob`.

> **Important:** The current Intention API implementation creates a
> successful one-time payment. It does not by itself create an
> automatically renewing monthly/yearly subscription. Recurring Paymob
> subscriptions are a separate Paymob Subscription API flow and require
> the appropriate recurring/Moto integration. Do not treat the current
> one-time payment as an automatically renewing subscription.

------------------------------------------------------------------------

# Phase 1: Core Infrastructure & Checkout

## Overview

Set up Paymob configuration, environment variables, server-side
Intention API checkout, Unified Checkout redirect, country/provider
routing, and the basic Paymob payment flow.

This phase builds the server-side infrastructure required before the
payment webhook is treated as the authoritative billing state.

## Prerequisites

-   Paymob Test account configured.
-   Paymob Test Integration `5883890` available.
-   Paymob Test API credentials available.
-   Existing Stripe integration remains unchanged.
-   Existing `User.isPro` field exists.
-   Existing usage utilities in `lib/stripe/usage.ts` remain unchanged
    during this phase.
-   Existing country detection and Stripe country routing are available.
-   `AUTH_URL` is configured per environment.

### Environment Variables

Local:

``` env
AUTH_URL="http://localhost:3000"

PAYMOB_API_KEY="..."
PAYMOB_SECRET_KEY="..."
PAYMOB_PUBLIC_KEY="..."
PAYMOB_HMAC_SECRET="..."
PAYMOB_INTEGRATION_ID="5883890"
PAYMOB_API_URL="https://accept.paymob.com"
```

Vercel:

``` env
AUTH_URL="https://dev-stash-kappa.vercel.app"

PAYMOB_API_KEY="..."
PAYMOB_SECRET_KEY="..."
PAYMOB_PUBLIC_KEY="..."
PAYMOB_HMAC_SECRET="..."
PAYMOB_INTEGRATION_ID="5883890"
PAYMOB_API_URL="https://accept.paymob.com"
```

> Never expose `PAYMOB_SECRET_KEY`, `PAYMOB_API_KEY`, or
> `PAYMOB_HMAC_SECRET` to the client.

`NEXT_PUBLIC_PAYMOB_IFRAME_ID` is intentionally not used. The current
implementation uses Paymob Unified Checkout and the Intention API.

## Requirements

-   Add/verify Paymob environment variables.
-   Keep the existing Test Integration ID `5883890`.
-   Create a server-side Paymob configuration/helper if useful.
-   Create `/api/paymob/intention`.
-   Accept only `monthly` or `yearly` from the client.
-   Keep pricing server-side.
-   Convert EGP amounts to smallest units.
-   Create a unique merchant reference for each payment.
-   Send `notification_url` to the Paymob webhook.
-   Send `redirection_url` to the settings page.
-   Return the Unified Checkout URL.
-   Do not trust client-provided amount, currency, or Integration ID.
-   Keep Paymob and Stripe provider selection separate from the payment
    implementation.

## Implementation

### 1. Paymob Server Configuration

Use server-only environment variables:

``` typescript
const PAYMOB_SECRET_KEY = process.env.PAYMOB_SECRET_KEY!;
const PAYMOB_PUBLIC_KEY = process.env.PAYMOB_PUBLIC_KEY!;
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID!;
const PAYMOB_API_URL =
  process.env.PAYMOB_API_URL || "https://accept.paymob.com";
```

Validate required environment variables in the application configuration
layer when practical.

### 2. Server-Side Plan Configuration

Do not accept a raw amount from the client.

Use:

``` typescript
const PLANS = {
  monthly: {
    amount: 40800,
    currency: "EGP",
  },
  yearly: {
    amount: 366900,
    currency: "EGP",
  },
} as const;

type Plan = keyof typeof PLANS;
```

The client sends:

``` json
{
  "plan": "monthly"
}
```

or:

``` json
{
  "plan": "yearly"
}
```

The server maps that value to the correct amount.

### 3. Create `app/api/paymob/intention/route.ts`

POST endpoint that:

1.  Authenticates the user with `auth()`.
2.  Returns `401` when unauthenticated.
3.  Accepts `{ plan: "monthly" | "yearly" }`.
4.  Rejects invalid plans with `400`.
5.  Looks up the user from the database.
6.  Uses the server-side plan configuration.
7.  Creates a unique merchant reference.
8.  Sends the Paymob Intention API request.
9.  Passes the numeric Integration ID.
10. Passes `notification_url`.
11. Passes `redirection_url`.
12. Returns the Unified Checkout URL.
13. Does not expose Paymob secret credentials.
14. Does not return raw Paymob internal errors to the client in
    production.

Example request body shape:

``` typescript
{
  amount: selectedPlan.amount,
  currency: selectedPlan.currency,

  payment_methods: [
    Number(PAYMOB_INTEGRATION_ID),
  ],

  special_reference: merchantOrderId,

  notification_url:
    `${process.env.AUTH_URL}/api/webhooks/paymob`,

  redirection_url:
    `${process.env.AUTH_URL}/dashboard/settings?upgraded=true`,

  items: [],

  billing_data: {
    email: user.email,
    first_name: user.name?.split(" ")[0] || "User",
    last_name:
      user.name?.split(" ").slice(1).join(" ") || "User",
    phone_number: "01000000000",
  },
}
```

The phone number is currently a Test value and must not remain
hard-coded for production.

### 4. Unified Checkout URL

Use the `client_secret` returned by the Intention API:

``` typescript
const checkoutUrl =
  `${PAYMOB_API_URL}/unifiedcheckout/` +
  `?publicKey=${encodeURIComponent(PAYMOB_PUBLIC_KEY)}` +
  `&clientSecret=${encodeURIComponent(clientSecret)}`;
```

Return:

``` json
{
  "url": "..."
}
```

The client redirects using:

``` typescript
window.location.href = data.url;
```

### 5. Paymob Dashboard Integration

Keep Test Integration `5883890`.

Recommended default dashboard callbacks for the deployed Test
environment:

``` text
Webhook URL:
https://dev-stash-kappa.vercel.app/api/webhooks/paymob

Redirect URL:
https://dev-stash-kappa.vercel.app/dashboard/settings?upgraded=true
```

The Intention API may override these per payment using:

``` typescript
notification_url
redirection_url
```

For local development, these values can point through a public tunnel.

### 6. Local Webhook Testing (or we can just test directly in Vercel)

Paymob does not use the Stripe CLI workflow directly.

Use a public tunnel such as ngrok or Cloudflare Tunnel:

``` bash
npm run dev
```

Then:

``` bash
ngrok http 3000
```

Temporarily set:

``` env
AUTH_URL="https://YOUR-NGROK-URL.ngrok-free.app"
```

Restart Next.js.

The payment flow becomes:

``` text
Paymob
  ↓
https://YOUR-NGROK-URL.ngrok-free.app
  ↓
localhost:3000
  ↓
/api/webhooks/paymob
```

Paymob's Webhook Testing Tool can also be used to capture and inspect
actual webhook payloads before relying on the production webhook
implementation.

## Existing Usage Utilities

Do not modify `lib/stripe/usage.ts` merely because Paymob was added.

The current usage layer is provider-agnostic because it receives:

``` typescript
isPro: boolean
```

and applies the existing free-tier limits.

Current limits:

  Constant            Value
  ------------------- -------
  `MAX_ITEMS`         50
  `MAX_COLLECTIONS`   5

The existing functions remain:

-   `getUserUsage(userId, isPro)`
-   `canCreateItem(userId, isPro)`
-   `canCreateCollection(userId, isPro)`

Stripe and Paymob both ultimately affect the user's Pro entitlement, so
usage logic should not be duplicated per provider.

## Phase 1 Testing

### Monthly

-   [ ] Client sends `{ plan: "monthly" }`.
-   [ ] Server uses `40800`.
-   [ ] Currency is `EGP`.
-   [ ] Integration ID is `5883890`.
-   [ ] Paymob Unified Checkout opens.
-   [ ] Test card completes successfully.
-   [ ] User is redirected to `/dashboard/settings?upgraded=true`.

### Yearly

-   [ ] Client sends `{ plan: "yearly" }`.
-   [ ] Server uses `366900`.
-   [ ] Currency is `EGP`.
-   [ ] Paymob Unified Checkout opens.
-   [ ] Test card completes successfully.
-   [ ] User is redirected to `/dashboard/settings?upgraded=true`.

### Security

-   [ ] Client cannot choose the amount.
-   [ ] Client cannot choose the Integration ID.
-   [ ] Client cannot provide Paymob secret credentials.
-   [ ] Invalid plan values return `400`.
-   [ ] Unauthenticated requests return `401`.

------------------------------------------------------------------------

# Phase 2: Webhooks, Payment Records, Subscription Entitlements & UI

## Overview

Make Paymob's server-to-server callback the authoritative payment
confirmation, verify HMAC, add idempotent payment records, connect
successful payments to Pro entitlement, and wire Paymob into the
existing feature gating and billing UI.

This phase should also establish the correct data model for future
recurring subscriptions.

> **Important:** Do not implement automatic renewal by simply adding
> `+30` or `+365` days unless the product explicitly chooses a
> one-time-payment entitlement model. Paymob recurring subscriptions use
> a separate subscription API flow.

## Prerequisites

-   Phase 1 complete.
-   Successful Paymob Test payment completed.
-   Paymob webhook reaches `/api/webhooks/paymob`.
-   Vercel logs show `POST 200 /api/webhooks/paymob`.
-   HMAC query parameter is received.
-   Actual Paymob callback payload has been inspected.
-   Test integration `5883890` is working.
-   Stripe integration remains functional.

## Requirements

-   Verify Paymob HMAC before processing a transaction.
-   Use the exact documented HMAC field order.
-   Reject missing/invalid HMAC.
-   Validate successful transaction status.
-   Identify the DevStash payment safely.
-   Add a Payment database record.
-   Make webhook processing idempotent.
-   Store Paymob transaction/order/reference identifiers.
-   Record plan, amount, and currency.
-   Update the user's Pro entitlement only after verified payment.
-   Keep Stripe and Paymob payment records distinguishable.
-   Gate free-tier features through the existing usage utilities.
-   Keep file/image uploads restricted for free users.
-   Update billing UI to display Paymob pricing where applicable.
-   Preserve the existing Stripe flow for Stripe-supported countries.

## Implementation

### 1. Create `app/api/webhooks/paymob/route.ts`

POST endpoint that:

1.  Reads the JSON request body.
2.  Reads `hmac` from the query string.
3.  Rejects requests without HMAC.
4.  Reconstructs the documented Paymob HMAC string from the transaction
    object.
5.  Calculates SHA-512 HMAC using `PAYMOB_HMAC_SECRET`.
6.  Compares HMAC using a timing-safe comparison.
7.  Rejects invalid signatures with `401`.
8.  Extracts the merchant reference.
9.  Finds the corresponding Payment record.
10. Checks whether the payment was already processed.
11. Confirms the transaction is successful and not pending.
12. Marks the payment as `PAID`.
13. Updates the user's Pro entitlement.
14. Returns `{ received: true }`.

### 2. Paymob Transaction HMAC

The transaction callback HMAC must use the exact documented field order:

``` text
obj.amount_cents
obj.created_at
obj.currency
obj.error_occured
obj.has_parent_transaction
obj.id
obj.integration_id
obj.is_3d_secure
obj.is_auth
obj.is_capture
obj.is_refunded
obj.is_standalone_payment
obj.is_voided
obj.order.id
obj.owner
obj.pending
obj.source_data.pan
obj.source_data.sub_type
obj.source_data.type
obj.success
```

Concatenate the values without separators and calculate:

``` text
HMAC-SHA512
```

using:

``` env
PAYMOB_HMAC_SECRET
```

Boolean values must be represented as lowercase:

``` text
true
false
```

The comparison must be timing-safe.

Do not use:

``` typescript
HMAC(JSON.stringify(body))
```

for the transaction callback.

### 3. Payment Record

Do not rely only on:

``` typescript
user.isPro = true;
```

for production billing state.

Create a payment record so every Paymob/Stripe transaction can be
traced.

Suggested model:

``` prisma
enum PaymentProvider {
  STRIPE
  PAYMOB
}

enum PaymentPlan {
  MONTHLY
  YEARLY
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}

model Payment {
  id                    String          @id @default(cuid())

  userId                String
  user                  User            @relation(fields: [userId], references: [id], onDelete: Cascade)

  provider              PaymentProvider
  plan                  PaymentPlan

  amount                Int
  currency              String

  status                PaymentStatus   @default(PENDING)

  providerTransactionId String?
  providerOrderId       String?
  merchantReference     String?

  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt

  @@index([userId])
  @@index([provider, providerTransactionId])
  @@index([merchantReference])
}
```

The exact Prisma relation names should be adapted to the existing
schema.

### 4. Merchant Reference

Avoid fragile parsing such as:

``` typescript
merchantOrderId.split("_")[1]
```

Prefer a payment record ID:

``` text
devstash_<paymentId>
```

or another unique reference that maps directly to a Payment record.

Recommended flow:

``` text
Create Payment(PENDING)
        ↓
Create Paymob Intention
        ↓
special_reference = payment reference
        ↓
Paymob payment
        ↓
Webhook
        ↓
Find Payment
        ↓
Verify HMAC
        ↓
Mark PAID
```

This also makes duplicate webhook handling much safer.

### 5. Idempotency

Paymob may retry callbacks.

The webhook must be safe if the same transaction arrives more than once.

Example logic:

``` typescript
const payment = await prisma.payment.findUnique({
  where: {
    merchantReference,
  },
});

if (!payment) {
  return NextResponse.json(
    { error: "Payment not found" },
    { status: 404 }
  );
}

if (payment.status === "PAID") {
  return NextResponse.json({ received: true });
}
```

For stronger protection, use a unique database constraint on the
appropriate provider transaction/reference identifier.

### 6. Subscription/Entitlement Model

Do not put all billing state directly on `User`.

Avoid making these the permanent source of truth:

``` prisma
isPro       Boolean
proExpiresAt DateTime?
subscriptionPlan String?
```

because multiple payment providers and future recurring subscriptions
require more information.

A future subscription model should track:

``` text
provider
plan
status
currentPeriodStart
currentPeriodEnd
providerSubscriptionId
```

Suggested enums:

``` prisma
enum SubscriptionStatus {
  ACTIVE
  CANCELED
  EXPIRED
  PAST_DUE
}
```

Suggested structure:

``` prisma
model Subscription {
  id                     String             @id @default(cuid())

  userId                 String             @unique
  user                   User               @relation(fields: [userId], references: [id], onDelete: Cascade)

  provider               PaymentProvider
  plan                   PaymentPlan
  status                 SubscriptionStatus @default(ACTIVE)

  currentPeriodStart     DateTime
  currentPeriodEnd       DateTime

  providerSubscriptionId String?

  createdAt              DateTime           @default(now())
  updatedAt              DateTime           @updatedAt
}
```

The exact schema should be reconciled with the existing Stripe fields
before migration.

### 7. Important: One-Time Paymob vs Recurring Paymob

The current Intention API flow is a one-time payment.

If DevStash chooses:

``` text
408 EGP → 30 days of Pro
```

or:

``` text
3669 EGP → 365 days of Pro
```

then an entitlement period can be recorded in
`Subscription.currentPeriodEnd`, and the user can manually renew.

However, that is **not automatic recurring billing**.

For actual recurring Paymob billing, use Paymob's Subscription API.

Paymob's current subscription documentation supports subscription plans
with frequencies including:

``` text
7
15
30
60
90
180
360
```

and requires a Moto integration ID for recurring transactions.

Recurring subscription work should therefore be treated as a billing
enhancement rather than pretending the current Intention payment is
recurring.

### 8. Usage Utilities

Once subscription/entitlement state exists, update the usage layer so it
determines whether Pro is currently active.

The goal is:

``` typescript
const isPro =
  subscription?.status === "ACTIVE" &&
  subscription.currentPeriodEnd > new Date();
```

Then the existing usage checks remain provider-agnostic:

``` typescript
canCreateItem = isPro || itemCount < MAX_ITEMS;
canCreateCollection = isPro || collectionCount < MAX_COLLECTIONS;
```

Do not create separate:

``` text
canCreateItemForStripe()
canCreateItemForPaymob()
```

functions.

### 9. Feature Gating

Keep the existing feature-gating architecture.

#### Items

In `lib/actions/itemsActions.ts`:

-   Check whether file/image items require Pro.
-   Check `canCreateItem(userId, isPro)`.
-   Return a clear free-tier error at the item limit.

#### Collections

In `lib/actions/collectionsActions.ts`:

-   Check `canCreateCollection(userId, isPro)`.
-   Return a clear free-tier error at the collection limit.

#### Uploads

In `app/api/upload/route.ts`:

-   Authenticate the user.
-   Read current Pro entitlement from the server/database.
-   Return `403` for free users attempting restricted uploads.

Never trust a client-provided `isPro` value for authorization.

### 10. Billing UI

Modify the existing `BillingSettings` component rather than creating a
second billing system.

For Paymob-supported countries:

``` text
Monthly
408 EGP / month

Yearly
3669 EGP / year
```

For Stripe-supported countries:

``` text
Monthly
$8 / month

Yearly
$72 / year
```

The client still sends only:

``` json
{
  "plan": "monthly"
}
```

or:

``` json
{
  "plan": "yearly"
}
```

The server decides the provider and amount.

### 11. Upgrade Success

Continue using:

``` text
/dashboard/settings?upgraded=true
```

After the redirect:

``` typescript
toast.success("Welcome to DevStash Pro!");
```

The success page/toast should not itself grant Pro access.

The webhook is responsible for authoritative billing state.

## Testing

### Paymob Webhook

Use a real successful Test payment and verify:

-   [ ] Paymob reaches `/api/webhooks/paymob`.
-   [ ] Request contains `hmac`.
-   [ ] HMAC verification succeeds.
-   [ ] Transaction has `success: true`.
-   [ ] Transaction has `pending: false`.
-   [ ] Correct Integration ID is received.
-   [ ] Correct amount is received.
-   [ ] Correct currency is received.
-   [ ] Correct merchant reference is found.
-   [ ] Payment changes from `PENDING` to `PAID`.
-   [ ] User receives Pro entitlement.
-   [ ] Duplicate webhook does not create a duplicate payment.
-   [ ] Duplicate webhook does not incorrectly extend entitlement.
-   [ ] Invalid HMAC returns `401`.
-   [ ] Missing HMAC returns `401`.
-   [ ] Unknown payment reference is rejected safely.

### Monthly Payment

-   [ ] `408 EGP` is displayed for Paymob.
-   [ ] API amount is `40800`.
-   [ ] Successful payment creates a Payment record.
-   [ ] Payment is marked `PAID`.
-   [ ] User becomes Pro.

### Yearly Payment

-   [ ] `3669 EGP` is displayed for Paymob.
-   [ ] API amount is `366900`.
-   [ ] Successful payment creates a Payment record.
-   [ ] Payment is marked `PAID`.
-   [ ] User becomes Pro.

### Feature Gating

-   [ ] Free user is blocked at 50 items.
-   [ ] Free user is blocked at 5 collections.
-   [ ] Free user cannot create restricted file/image items.
-   [ ] Free user cannot upload restricted files.
-   [ ] Pro user bypasses item limits.
-   [ ] Pro user bypasses collection limits.
-   [ ] Pro user can upload allowed files.

### Provider Routing

-   [ ] Stripe-supported country uses Stripe.
-   [ ] Paymob regional country uses Paymob.
-   [ ] `?country=US` can be used for testing.
-   [ ] `?country=EG` can be used for testing.
-   [ ] Provider choice is enforced server-side.
-   [ ] Client cannot force a different provider/amount.

## New Files

  --------------------------------------------------------------------------------
  File                                  Purpose
  ------------------------------------- ------------------------------------------
  `app/api/paymob/intention/route.ts`   Create Paymob Intentions

  `app/api/webhooks/paymob/route.ts`    Verify and process Paymob callbacks

  `lib/paymob/paymob.ts`                Optional Paymob server
                                        configuration/helper

  `prisma/schema.prisma`                Payment/subscription models
  --------------------------------------------------------------------------------

## Modified Files

  --------------------------------------------------------------------------------------
  File                                        Changes
  ------------------------------------------- ------------------------------------------
  `.env` / Vercel Environment Variables       Paymob credentials and Integration ID

  `components/settings/BillingSettings.tsx`   Paymob checkout/pricing

  `components/upgrade/UpgradePricing.tsx`     Paymob checkout/pricing

  `app/dashboard/settings/page.tsx`           Provider routing and usage

  `app/upgrade/page.tsx`                      Provider routing

  `lib/actions/itemsActions.ts`               Feature/usage gating

  `lib/actions/collectionsActions.ts`         Usage gating

  `app/api/upload/route.ts`                   Pro authorization

  `lib/stripe/usage.ts`                       Eventually use active entitlement rather
                                              than permanent `isPro`
  --------------------------------------------------------------------------------------

## Current Paymob Test Setup

### Test Integration

``` text
Integration ID: 5883890
Currency: EGP
Channel: online
Type: Non-Shopify
Payment Method: VPC
```

### Successful Sandbox Card

Use the official Paymob sandbox/test card supplied by Paymob.

Do not use a real production card against the Test integration.

### Local Webhook

There is no direct Paymob equivalent to:

``` bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

For local webhook testing, use:

``` bash
ngrok http 3000
```

or Cloudflare Tunnel, then point `AUTH_URL` to the public tunnel URL.

Paymob also provides a Webhook Testing Tool for capturing and inspecting
callback requests.

### Vercel Test

The current deployed test has already verified:

``` text
POST 200 /api/paymob/intention
POST 200 /api/webhooks/paymob
```

The successful Test payment upgraded the user to Pro.

## Important Notes

-   Paymob's webhook is the authoritative backend payment confirmation;
    the browser redirect is only the customer-facing response flow.
-   Do not grant Pro based solely on the redirect query parameter.
-   Do not trust client-provided amounts.
-   Do not trust client-provided Integration IDs.
-   Do not expose Paymob secret credentials to the browser.
-   Do not use `NEXT_PUBLIC_PAYMOB_IFRAME_ID`; the current flow uses
    Unified Checkout.
-   Keep `AUTH_URL` environment-specific.
-   For local webhook testing, `localhost` is not reachable by Paymob;
    use a public tunnel.
-   The current Paymob flow is one-time payment unless the separate
    Paymob Subscription API is implemented.
-   Do not implement expiration by blindly setting `isPro = false` in
    middleware.
-   Do not add `+30` or `+365` days until the product decision between
    one-time entitlement and recurring subscription is finalized.
-   Payment records should be introduced before production.
-   Subscription/entitlement should eventually become the source of
    truth for Pro access instead of a permanent `User.isPro` boolean.
-   Run `npm run build` after billing/schema changes.
-   Run the project's test suite after usage and billing changes.
