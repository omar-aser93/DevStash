# Current Feature: Stripe Integration - Phase 2: Webhooks, Feature Gating & UI

## Status

In Progress

## Goals

- Create Stripe webhook route at `app/api/webhooks/stripe/route.ts` handling `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, and `customer.subscription.deleted`
- Add feature gating (pro type check for file/image) and usage limit check (`canCreateItem`) to `lib/actions/itemsActions.ts`
- Add usage limit check (`canCreateCollection`) to `lib/actions/collectionsActions.ts`
- Add Pro subscription authorization check in `app/api/upload/route.ts`
- Create `components/settings/billing-settings.tsx` UI component displaying plan badge, usage meters, upgrade options, and billing portal management
- Integrate `BillingSettings` into `app/dashboard/settings/page.tsx` with server-side `getUserUsage` data fetching
- Implement upgrade success toast and search param cleanup for `/dashboard/settings?upgraded=true`
- Verify with `npm test`, `npm run lint`, and `npm run build`

## Notes

- Spec file: `context/features/stripe-phase-2-spec.md`
- Webhook route receives raw payload via `request.text()` and verifies signature with `stripe.webhooks.constructEvent()` using `STRIPE_WEBHOOK_SECRET`
- `checkout.session.completed` associates user via `metadata.userId`
- Recurring subscription and invoice events match via `stripeCustomerId` using `updateMany` for idempotency
- Subscription statuses: `active` or `trialing` set `isPro: true`; `deleted` or other statuses set `isPro: false`
- Payment failures log a warning without immediately downgrading (allowing Stripe automatic retries)
- Upgrade/portal redirect URLs target `/dashboard/settings` (and `/dashboard/settings?upgraded=true`)

## History

<!-- Keep this updated. Earliest to latest -->

- Project setup and boilerplate cleanup
- Completed Dashboard UI Phase 1: initialized ShadCN UI; built the dark `/dashboard` shell with centered search, New Collection and New Item actions, a clickable DS/DevStash identity group, and sidebar/main placeholders. Verified with `npm run build`.
- Completed Dashboard UI Phase 2: added collapsible desktop navigation, shadcn Sheet mobile navigation, item-type and collection links from mock data, a user area, dashboard metadata, and themed scrollbars. Verified with `npm run build`.
- Completed Dashboard UI Phase 3: built main dashboard layout with stats cards, recent collections section (with dominant item-type colored left borders and contained item-type icons), pinned items section (with item-type colored left borders), and 10 recent items list. Verified with `npm run build`.
- Completed Prisma 7 setup with Neon PostgreSQL database connection. Verified with `npm run dev`.
- completed creating queries for items and collections. and converted static dashboard & sidebar to dynamiclly fetched data.
- Fixed user-scoped tags, bounded dashboard collection queries, and added ESLint ignores for generated and auxiliary directories. Verified with Prisma schema validation, focused ESLint, and `tsc --noEmit`.
- Completed Auth setup with NextAuth + GitHub Provider. Verified with `npm run dev`.
- Completed Auth Credentials & Registration (Phase 2): added Credentials provider placeholder to auth.config.ts, full bcryptjs password verification in auth.ts, and created registration API route at /api/auth/register. Verified with database tests, TypeScript check, and Next.js build.
- completed Auth (Phase 3): added custom sign-in, sign-out pages . and user avatar & updated session logic.
- completed items & collections CRUD, And homepage UI .
- Completed Stripe Integration Phase 1: initialized Stripe Node SDK, created usage limit utilities with Vitest unit tests, updated NextAuth Session and JWT types and auth callbacks for dynamic `isPro` synchronization, and implemented Stripe Checkout and Customer Billing Portal API routes. Verified with `npm test`, `npm run lint`, and `npm run build`.
