# DevStash Billing Migration --- Agentic Implementation Spec

## Purpose

This document is the implementation plan for completing the billing
architecture after **Phase 1 (database migration) is already finished**.

The goal is to let an agentic coding agent (Codex in VS Code) implement
the remaining work incrementally, safely, and with verification
checkpoints.

------------------------------------------------------------------------

# Current State

Phase 1 is complete.

The Prisma schema now contains:

-   `PaymentProvider`: `STRIPE`, `PAYMOB`
-   `PaymentPlan`: `MONTHLY`, `YEARLY`
-   `PaymentStatus`: `PENDING`, `PAID`, `FAILED`, `REFUNDED`
-   `SubscriptionStatus`: `ACTIVE`, `TRIALING`, `PAST_DUE`, `CANCELED`,
    `EXPIRED`
-   `Subscription`
-   `Payment`
-   `User.subscriptions`
-   `User.payments`

The legacy fields are intentionally still present:

``` prisma
isPro                Boolean   @default(false)
stripeCustomerId     String?   @unique
stripeSubscriptionId String?   @unique
```

**Do not remove these fields yet.**

They are compatibility fields during the migration.

------------------------------------------------------------------------

# Target Architecture

``` text
                    ┌──────────────────────┐
                    │        User          │
                    │                      │
                    │ isPro (compatibility)│
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │     Subscription     │
                    │ Stripe / Paymob      │
                    │ Monthly / Yearly     │
                    │ Status + Period      │
                    └──────────┬───────────┘
                               │
                         entitlement
                               │
                    ┌──────────▼───────────┐
                    │ Access + Usage Limits│
                    └──────────────────────┘

                    ┌──────────────────────┐
                    │       Payment        │
                    │ Stripe / Paymob      │
                    │ Paid / Failed / ...  │
                    └──────────────────────┘
```

**Subscription** represents billing/entitlement lifecycle.

**Payment** represents an individual money transaction.

**User.isPro** is a temporary compatibility cache.

------------------------------------------------------------------------

# Agent Operating Rules

Before changing code, the agent MUST:

1.  Read `AGENTS.md`.
2.  Read relevant context files referenced by `AGENTS.md`.
3.  Inspect the actual repository before relying on examples in this
    document.
4.  Preserve existing project conventions.
5.  Never expose or log secrets.
6.  Never hardcode Stripe price IDs or Paymob credentials.
7.  Never trust client-supplied amount, currency, price ID, or
    integration ID.
8.  Never grant Pro from a browser redirect alone.
9.  Treat verified provider webhooks as the billing source of truth.
10. Keep implementation incremental.
11. Run relevant lint/type/build/tests after each phase.
12. Do not refactor unrelated application code.
13. Do not remove legacy billing fields until the cleanup phase.
14. If provider SDK/API behavior differs from this document, inspect
    current types/docs and adapt rather than forcing outdated examples.

------------------------------------------------------------------------

# PHASE 2 --- Migrate Stripe to the Billing Models

## Objective

Make Stripe populate:

-   `Subscription`
-   `Payment`

while continuing to synchronize:

-   `User.isPro`
-   `User.stripeCustomerId`
-   `User.stripeSubscriptionId`

The existing Stripe checkout flow must remain functional.

------------------------------------------------------------------------

## Phase 2.1 --- Add Stripe Plan Metadata

### File

``` text
app/api/stripe/checkout/route.ts
```

The server already knows:

``` text
user.id
plan
```

Add the plan to both Checkout Session metadata and Subscription
metadata:

``` ts
metadata: {
  userId: user.id,
  plan,
},

subscription_data: {
  metadata: {
    userId: user.id,
    plan,
  },
},
```

Continue mapping plans server-side:

``` text
monthly → STRIPE_PRICE_ID_MONTHLY
yearly  → STRIPE_PRICE_ID_YEARLY
```

Never accept a Stripe Price ID from the browser.

### Verify

-   Monthly checkout carries `plan=monthly`.
-   Yearly checkout carries `plan=yearly`.

Do not redesign the UI.

------------------------------------------------------------------------

# Phase 2.2 --- Create Stripe Billing Helpers

Inspect the existing project structure first.

If appropriate, create:

``` text
lib/
  billing/
    stripe.ts
    entitlement.ts
```

Do not create duplicate abstractions if the repository already has an
equivalent.

------------------------------------------------------------------------

# Phase 2.3 --- Stripe Subscription Lifecycle

## Events

Handle:

``` text
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
```

For each Stripe subscription, maintain one corresponding database
`Subscription` identified by:

``` text
provider = STRIPE
providerSubscriptionId = Stripe subscription ID
```

Do not create duplicate subscriptions.

### User identification

Prefer:

``` text
subscription.metadata.userId
```

Use the existing Stripe customer mapping as a fallback where necessary.

### Plan

Prefer application metadata:

``` text
subscription.metadata.plan
```

Do not guess the plan if metadata is missing.

If metadata is missing for an existing subscription, use the Stripe
Price information as a fallback and document the fallback.

### Period

Mirror Stripe's actual billing period into:

``` text
currentPeriodStart
currentPeriodEnd
```

Do not manually add 30 or 365 days for Stripe.

### Status mapping

Map Stripe states into the existing Prisma enum.

Conceptually:

``` text
active      → ACTIVE
trialing    → TRIALING
past_due    → PAST_DUE
canceled    → CANCELED
```

For Stripe statuses that do not have an exact local enum, choose the
safest existing state based on current application behavior. Do not add
enum values without a concrete need.

### Pro synchronization

For the current MVP:

``` text
ACTIVE / TRIALING → isPro = true
CANCELED / EXPIRED → isPro = false
```

Do not immediately downgrade solely because an invoice payment failed.

`PAST_DUE` requires deliberate policy. Preserve access according to the
current product policy rather than inventing a grace-period system.

------------------------------------------------------------------------

# Phase 2.4 --- `checkout.session.completed`

Purpose:

-   link the application user to the Stripe customer
-   store the Stripe subscription ID
-   ensure the Subscription can be synchronized

Do not automatically create a fake Payment from the Checkout Session.

The Checkout Session is a checkout event; recurring billing payments
should be represented using actual successful/failed invoice payment
events.

If subscription details are needed, retrieve them through the Stripe
SDK.

Avoid unnecessary Stripe API calls if the event already contains
sufficient data.

------------------------------------------------------------------------

# Phase 2.5 --- `invoice.paid`

This is the primary event for successful recurring payment records.

Flow:

``` text
invoice.paid
     ↓
Payment
     ↓
PAID
```

Create or update a `Payment` with:

-   `userId`
-   `provider = STRIPE`
-   `plan`
-   `amount`
-   `currency`
-   `status = PAID`
-   provider transaction identifier
-   provider order/reference where appropriate

Use real Stripe identifiers.

Do not use the Checkout Session ID as a substitute for a payment
transaction unless there is a concrete reason.

### Idempotency

Repeated `invoice.paid` delivery must not create duplicate payments.

Use a stable provider identifier/reference.

------------------------------------------------------------------------

# Phase 2.6 --- `invoice.payment_failed`

Create or update the corresponding Payment:

``` text
status = FAILED
```

Do NOT automatically execute:

``` text
isPro = false
```

A failed invoice does not necessarily mean the subscription has ended.

Let subscription lifecycle events determine the final entitlement state.

------------------------------------------------------------------------

# Phase 2.7 --- `customer.subscription.deleted`

Do not delete the database Subscription.

Instead:

``` text
Subscription.status = CANCELED
```

Synchronize the compatibility fields according to the current
application lifecycle:

``` text
User.isPro = false
stripeSubscriptionId = null
```

Do not delete billing history.

------------------------------------------------------------------------

# Phase 2.8 --- Stripe Webhook Security

Keep raw-body signature verification:

``` ts
stripe.webhooks.constructEvent(...)
```

Do not replace it with custom JSON/HMAC logic.

Reject:

-   missing signature
-   invalid signature
-   missing webhook secret

Return an appropriate error and do not mutate billing state.

------------------------------------------------------------------------

# Phase 2.9 --- Stripe Testing

Test one scenario at a time.

### A. Monthly subscription

Expected:

``` text
User.isPro = true

Subscription:
provider = STRIPE
plan = MONTHLY
status = ACTIVE
correct currentPeriodStart
correct currentPeriodEnd

Payment:
provider = STRIPE
plan = MONTHLY
status = PAID
```

### B. Yearly subscription

Expected:

``` text
Subscription.plan = YEARLY
Payment.plan = YEARLY
```

### C. Renewal

Expected:

``` text
new Payment = PAID
Subscription.currentPeriodEnd = new Stripe period end
```

No duplicate Subscription.

### D. Failed payment

Expected:

``` text
Payment = FAILED
```

Do not immediately downgrade solely from this event.

### E. Cancellation

Expected:

``` text
Subscription.status = CANCELED
User.isPro = false
```

Do not delete the Subscription.

### F. Duplicate webhook

Send/process the same event twice.

Expected:

``` text
no duplicate Subscription
no duplicate Payment
```

------------------------------------------------------------------------

# PHASE 3 --- Migrate Paymob to the Billing Models

## Objective

Keep the currently working Paymob Intention flow, but connect it to:

-   `Payment`
-   `Subscription`
-   `User.isPro`

Important:

## Current Paymob flow is NOT recurring.

It is currently:

``` text
Paymob Intention
      ↓
Customer pays
      ↓
Verified webhook
      ↓
Payment = PAID
      ↓
Local entitlement
```

Do not describe this as automatic recurring billing.

------------------------------------------------------------------------

# Phase 3.1 --- Create a Pending Paymob Payment Before Checkout

### File

``` text
app/api/paymob/intention/route.ts
```

Current code generates a merchant reference that contains the user ID.

Move toward a database-backed reference.

Flow:

``` text
Authenticated user
      ↓
Validate plan
      ↓
Determine amount server-side
      ↓
Create Payment
status = PENDING
      ↓
Generate/store merchantReference
      ↓
Create Paymob Intention
```

The `Payment` should contain:

``` text
userId
provider = PAYMOB
plan
amount
currency
status = PENDING
merchantReference
```

Send the same stable reference to Paymob.

Do not rely permanently on:

``` text
merchantReference.split("_")
```

for user identification.

The database Payment should be the source of the mapping.

------------------------------------------------------------------------

# Phase 3.2 --- Paymob Webhook HMAC

Keep the currently verified HMAC implementation.

The webhook must:

1.  Read the transaction fields required by Paymob.
2.  Concatenate them in the exact documented order.
3.  Calculate HMAC-SHA512.
4.  Compare using a timing-safe comparison.
5.  Reject invalid HMAC.
6.  Only mutate billing state after verification.

Do NOT replace this with:

``` text
HMAC(JSON.stringify(body))
```

The existing verified 20-field Paymob HMAC process should remain.

------------------------------------------------------------------------

# Phase 3.3 --- Paymob Successful Payment

When:

``` text
success === true
pending === false
```

then:

1.  Locate the Payment using `merchantReference`.
2.  Verify the Payment exists.
3.  Verify the payment/user relationship.
4.  Mark Payment as:

``` text
PAID
```

5.  Store provider transaction/order IDs where available.
6.  Make the operation idempotent.

Duplicate webhook:

``` text
one Payment
one successful state transition
```

No duplicate Payment rows.

------------------------------------------------------------------------

# Phase 3.4 --- Temporary Paymob Subscription

Until Paymob recurring is implemented, create a local time-limited
Subscription after a successful payment.

Monthly:

``` text
currentPeriodStart = transaction/payment time
currentPeriodEnd = +30 days
```

Yearly:

``` text
currentPeriodStart = transaction/payment time
currentPeriodEnd = +365 days
```

This is application-managed entitlement.

It is NOT automatic Paymob recurring billing.

Do not use this approach for Stripe.

------------------------------------------------------------------------

# Phase 3.5 --- Paymob Expiration

A Paymob Subscription should stop granting entitlement when:

``` text
currentPeriodEnd <= now
```

The entitlement system in Phase 4 will enforce this.

A future scheduled cleanup can mark expired subscriptions:

``` text
EXPIRED
```

but entitlement must not depend on that cleanup job having run.

------------------------------------------------------------------------

# Phase 3.6 --- Paymob Testing

### A. Monthly

``` text
Payment = PAYMOB / MONTHLY / PAID
Subscription = PAYMOB / MONTHLY / ACTIVE
period ≈ 30 days
isPro = true
```

### B. Yearly

``` text
Payment = PAYMOB / YEARLY / PAID
Subscription = PAYMOB / YEARLY / ACTIVE
period ≈ 365 days
isPro = true
```

### C. Duplicate webhook

Expected:

``` text
one Payment
one entitlement
```

### D. Invalid HMAC

Expected:

``` text
request rejected
no Payment update
no Pro upgrade
```

------------------------------------------------------------------------

# PHASE 4 --- Unified Entitlement System

## Objective

Stop using `User.isPro` as the ultimate source of truth for application
access.

New source:

``` text
Subscription
```

`isPro` remains temporarily as a compatibility field.

------------------------------------------------------------------------

# Phase 4.1 --- Create Entitlement Helper

Suggested file:

``` text
lib/billing/entitlement.ts
```

Create a helper such as:

``` text
getActiveSubscription(userId)
```

It should find a valid subscription based on:

``` text
userId
status
currentPeriodEnd > now
```

Current active entitlement should include:

``` text
ACTIVE
TRIALING
```

Do not include:

``` text
CANCELED
EXPIRED
```

For `PAST_DUE`, follow the policy established during Stripe migration.

------------------------------------------------------------------------

# Phase 4.2 --- `getUserEntitlement`

Create:

``` text
getUserEntitlement(userId)
```

Return:

``` text
true
```

when the user has valid paid entitlement.

Otherwise:

``` text
false
```

This becomes the preferred application-level access check.

------------------------------------------------------------------------

# Phase 4.3 --- Update Usage

Current file:

``` text
lib/stripe/usage.ts
```

is provider-agnostic despite its name.

Do not rename it yet unless useful.

Initially keep:

``` ts
getUserUsage(userId, isPro)
```

and have callers obtain:

``` text
getUserEntitlement(userId)
```

first.

Flow:

``` text
userId
  ↓
getUserEntitlement()
  ↓
isPro
  ↓
getUserUsage()
```

Do not add a subscription query to every usage count if it is
unnecessary.

------------------------------------------------------------------------

# Phase 4.4 --- Preserve Existing Limits

Do not change:

``` text
MAX_ITEMS = 50
MAX_COLLECTIONS = 5
```

Free:

``` text
items < 50
collections < 5
```

Pro:

``` text
unlimited according to current application behavior
```

------------------------------------------------------------------------

# PHASE 5 --- Migrate Application Pro Checks

## Objective

Gradually replace direct access decisions based on:

``` text
session.user.isPro
User.isPro
```

with:

``` text
getUserEntitlement(userId)
```

------------------------------------------------------------------------

# Phase 5.1 --- Search the Repository

Search for:

``` text
isPro
```

Categorize each usage:

### Billing synchronization

Keep.

Examples:

``` text
Stripe webhook
Paymob webhook
```

### Access control

Migrate to entitlement.

### Usage enforcement

Migrate to entitlement.

### UI-only display

Can temporarily continue using `isPro`, but prefer fresh entitlement
where appropriate.

------------------------------------------------------------------------

# Phase 5.2 --- Middleware

Do not automatically add a database query to middleware.

Inspect the current middleware first.

If it only protects authenticated routes:

``` text
keep authentication there
```

For Pro-only operations, enforce entitlement at the
server/API/server-action boundary.

------------------------------------------------------------------------

# Phase 5.3 --- Server Actions and API Routes

Find:

``` ts
if (user.isPro)
```

and:

``` ts
session.user.isPro
```

For each occurrence determine whether it is:

-   display
-   access control
-   usage limit
-   billing

Migrate access-control and usage-limit logic first.

Do not blindly replace every UI occurrence.

------------------------------------------------------------------------

# PHASE 6 --- Billing UI and Country Routing

## Objective

Keep the current billing UI and country routing intact.

Current intended routing:

``` text
Stripe-supported country
        ↓
Stripe

Unsupported country
        ↓
Paymob
```

Do not redesign this phase.

------------------------------------------------------------------------

# Phase 6.1 --- Settings

Keep the current:

``` text
country
stripeSupported
```

flow.

Settings should continue passing the required information to billing UI
components.

------------------------------------------------------------------------

# Phase 6.2 --- Checkout Buttons

The client sends only the plan choice:

``` text
monthly
yearly
```

The server determines:

``` text
amount
currency
provider
Stripe Price ID
Paymob integration/configuration
```

Never trust client billing values.

------------------------------------------------------------------------

# Phase 6.3 --- Success Redirect

A URL such as:

``` text
/dashboard/settings?upgraded=true
```

is UX only.

It must NOT grant Pro.

Correct flow:

``` text
Payment succeeds
      ↓
Verified webhook
      ↓
Database update
      ↓
Entitlement active
      ↓
UI displays success
```

If redirect happens before webhook processing, the UI should tolerate
the delay and refresh/revalidate billing state.

------------------------------------------------------------------------

# PHASE 7 --- Existing User Data Migration

## Objective

Protect existing users during migration.

------------------------------------------------------------------------

# Phase 7.1 --- Existing Stripe Users

Find users with:

``` text
stripeSubscriptionId != null
```

For each:

1.  Retrieve the Stripe subscription.
2.  Determine current status.
3.  Determine plan.
4.  Determine billing period.
5.  Create corresponding Subscription if missing.
6.  Preserve existing `isPro` until verification is complete.

Do not blindly convert:

``` text
isPro = true
```

into:

``` text
Subscription = ACTIVE
```

without checking Stripe.

------------------------------------------------------------------------

# Phase 7.2 --- Existing Paymob Users

Inspect available historical Paymob data.

If reliable provider history is unavailable:

``` text
do not fabricate Payment records
do not fabricate transaction IDs
do not invent subscription dates
```

Handle unverifiable legacy Pro users according to the current
product/business policy.

------------------------------------------------------------------------

# Phase 7.3 --- Migration Verification

Compare:

``` text
legacy isPro
```

against:

``` text
current entitlement
```

Find mismatches and investigate them before removing legacy fields.

------------------------------------------------------------------------

# PHASE 8 --- Paymob True Recurring Subscriptions

## Important

This is a separate phase.

Do not implement it during the initial Paymob migration.

The current Paymob Intention flow is one-time.

Final target:

``` text
Paymob Subscription
        ↓
automatic recurring charge
        ↓
verified webhook
        ↓
Payment
        ↓
Subscription lifecycle
```

Before coding:

1.  Inspect Paymob dashboard.
2.  Verify recurring/MOTO capability.
3.  Verify available test integrations.
4.  Verify subscription-plan support.
5.  Create/test monthly plan.
6.  Create/test yearly plan.
7.  Confirm current API requirements.
8.  Only then implement.

Do not assume the current VPC integration is sufficient for recurring
billing.

------------------------------------------------------------------------

# Phase 8.1 --- Paymob Recurring Database Mapping

When recurring Paymob is available:

``` text
Subscription.provider = PAYMOB
Subscription.providerSubscriptionId = Paymob subscription ID
```

Each successful recurring charge creates/updates a Payment.

The Subscription period/status must mirror actual Paymob subscription
state.

Do not simulate recurring billing with local timers.

------------------------------------------------------------------------

# Phase 8.2 --- Recurring Paymob Failure

When Paymob reports a recurring payment failure:

``` text
Payment = FAILED
```

Then update Subscription according to the provider's actual subscription
state.

Do not automatically cancel merely because one payment failed unless the
provider actually terminates the subscription or the product policy
explicitly requires it.

------------------------------------------------------------------------

# PHASE 9 --- Billing Reliability Hardening

## Phase 9.1 --- Idempotency

Verify all webhooks handle:

``` text
duplicate events
provider retries
out-of-order events
```

Stable identities:

``` text
Payment → provider transaction/reference
Subscription → provider subscription ID
```

------------------------------------------------------------------------

# Phase 9.2 --- Atomic Updates

Where a single event must update multiple related records, use Prisma
transactions where appropriate.

Example:

``` text
Payment → PAID
Subscription → ACTIVE
User.isPro → true
```

Avoid partially applied billing state.

------------------------------------------------------------------------

# Phase 9.3 --- Logging

Use useful structured logs.

Examples:

``` text
[Stripe Webhook]
event=invoice.paid
subscription=sub_xxx
```

``` text
[Paymob Webhook]
transaction=<provider id>
payment=<internal id>
status=PAID
```

Never log:

-   secret keys
-   card numbers
-   CVV
-   authentication credentials
-   unnecessary sensitive payment payloads

------------------------------------------------------------------------

# PHASE 10 --- Final Cleanup

Only after all billing providers and entitlement checks are stable.

------------------------------------------------------------------------

# Phase 10.1 --- Remove Stripe-Specific Subscription Fields

Eventually this can be removed:

``` text
stripeSubscriptionId
```

because the unified model contains:

``` text
Subscription.provider
Subscription.providerSubscriptionId
```

Only remove it after every code reference has been migrated.

------------------------------------------------------------------------

# Phase 10.2 --- Remove `isPro`

Eventually:

``` text
User.isPro
```

can be removed.

Final source:

``` text
User
  ↓
Subscription
  ↓
Entitlement
```

Do not remove it during the migration.

------------------------------------------------------------------------

# Phase 10.3 --- Rename Usage Utility

Because:

``` text
lib/stripe/usage.ts
```

is actually provider-agnostic, it can eventually become:

``` text
lib/billing/usage.ts
```

Only rename after safely migrating imports.

------------------------------------------------------------------------

# FINAL TEST MATRIX

## Stripe

``` text
□ Monthly subscription
□ Yearly subscription
□ checkout.session.completed
□ subscription.created
□ subscription.updated
□ invoice.paid
□ invoice.payment_failed
□ subscription.deleted
□ duplicate webhook
□ invalid webhook signature
□ renewal updates period
□ no duplicate payments
□ no duplicate subscriptions
```

## Paymob

``` text
□ Monthly payment
□ Yearly payment
□ Payment starts PENDING
□ Successful webhook → PAID
□ Subscription created
□ 30-day entitlement
□ 365-day entitlement
□ duplicate webhook
□ invalid HMAC
□ failed transaction does not grant Pro
□ expired entitlement loses access
```

## Application

``` text
□ Free user limited to 50 items
□ Free user limited to 5 collections
□ Pro user bypasses limits
□ Settings billing UI works
□ Country routing works
□ Success redirect does not grant Pro
□ Existing Stripe users remain correct
□ lint passes
□ typecheck passes
□ build passes
□ tests pass
```

------------------------------------------------------------------------

# Recommended Agent Workflow

Do not ask the agent to implement the entire billing system in one shot.

Use one phase at a time:

``` text
PHASE 1  ✅ Database
   ↓
PHASE 2  Stripe migration
   ↓
CHECKPOINT
   ↓
PHASE 3  Paymob one-time migration
   ↓
CHECKPOINT
   ↓
PHASE 4  Unified entitlement
   ↓
CHECKPOINT
   ↓
PHASE 5  Application Pro checks
   ↓
PHASE 6  Billing UI verification
   ↓
PHASE 7  Existing-user migration
   ↓
PHASE 8  Paymob recurring
   ↓
PHASE 9  Reliability hardening
   ↓
PHASE 10 Cleanup
```

After each phase:

1.  Review the diff.
2.  Run verification.
3.  Manually test provider behavior when required.
4.  Commit the phase.
5.  Only then move to the next phase.

------------------------------------------------------------------------

# Agent Prompt Template

Use this at the start of each phase in Codex:

``` text
Read AGENTS.md and the billing implementation spec first.

We are implementing [PHASE X].

Do not implement future phases yet.

First inspect the current repository and identify the exact files/functions that need to change.

Follow the billing spec and existing project conventions.

Before making changes:
- explain the files you plan to modify
- identify conflicts between the spec and the current code
- do not guess provider API behavior

Then implement only this phase.

After implementation:
- run relevant lint/type/build/tests
- summarize changed files
- summarize verification results
- identify anything that requires manual provider testing

Do not modify unrelated code.
Do not remove legacy billing fields yet.
```

------------------------------------------------------------------------

# Critical Rules

## Rule 1 --- Webhook is the source of truth

Never:

``` text
redirect → isPro=true
```

Always:

``` text
provider event
    ↓
verified webhook
    ↓
database
    ↓
entitlement
```

------------------------------------------------------------------------

## Rule 2 --- Payment and Subscription are different

Payment means:

``` text
"I received money."
```

Subscription means:

``` text
"This user currently has paid entitlement."
```

One subscription can have many payments:

``` text
Subscription #1
   ├── Payment #1
   ├── Payment #2
   ├── Payment #3
   └── Payment #4
```

------------------------------------------------------------------------

## Rule 3 --- Stripe period comes from Stripe

Do not calculate:

``` text
Stripe +30 days
Stripe +365 days
```

Stripe manages recurring billing.

Your database mirrors Stripe.

------------------------------------------------------------------------

## Rule 4 --- Current Paymob is temporary one-time entitlement

Until Paymob recurring is implemented:

``` text
Paymob payment
    ↓
30/365-day local entitlement
```

This is temporary.

It is not automatic recurring billing.

------------------------------------------------------------------------

## Rule 5 --- Never trust client billing values

Client requests:

``` text
monthly
```

Server determines the actual:

``` text
price
currency
provider
provider price/integration
```

------------------------------------------------------------------------

# Definition of Done

The migration is complete when:

``` text
Stripe
  ✅ recurring subscriptions
  ✅ subscription lifecycle
  ✅ payment history
  ✅ idempotent webhooks

Paymob
  ✅ verified HMAC
  ✅ payment history
  ✅ temporary entitlement
  ⏳ true recurring subscriptions (Phase 8)

Application
  ✅ unified entitlement
  ✅ usage limits
  ✅ existing users preserved

Database
  ✅ Subscription
  ✅ Payment
  ✅ legacy fields retained until safe cleanup

Reliability
  ✅ duplicate webhooks safe
  ✅ invalid webhooks rejected
  ✅ provider state is source of truth
```

------------------------------------------------------------------------

# Important Implementation Note

This document is an implementation roadmap, not permission to blindly
apply every code snippet.

The actual repository, installed SDK versions, Prisma version,
authentication flow, existing billing routes, and current provider APIs
are authoritative.

If this document conflicts with the repository:

1.  inspect the repository;
2.  inspect current provider types/docs;
3.  preserve working behavior;
4.  choose the safest implementation;
5.  report the discrepancy before making a risky architectural change.

The goal is a **safe incremental billing migration**, not a large
rewrite.
