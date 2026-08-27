# Current Feature: Stripe Integration - Phase 1: Core Infrastructure

## Status

In Progress

## Goals

- Install `stripe` npm package
- Initialize Stripe SDK in `lib/stripe/stripe.ts`
- Create usage limit utilities in `lib/stripe/usage.ts` (`MAX_ITEMS = 50`, `MAX_COLLECTIONS = 3`, `getUserUsage`, `canCreateItem`, `canCreateCollection`)
- Add unit tests for usage limit utilities in `lib/stripe/usage.test.ts`
- Add `isPro` property to NextAuth `Session` and `JWT` type declarations
- Update NextAuth callbacks in `lib/auth.ts` to sync `isPro` from database on session validation
- Create Stripe Checkout Session API endpoint at `app/api/stripe/checkout/route.ts`
- Create Stripe Customer Billing Portal API endpoint at `app/api/stripe/portal/route.ts`
- Verify tests pass with `npm test` and typecheck/build with `npm run build`

## Notes

- Spec file: `context/features/stripe-phase-1-spec.md`
- Price IDs stay server-side only: Client sends `{ plan: 'monthly' | 'yearly' }`, API maps to env vars (`STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_YEARLY`)
- Checkout route validates plan input against allowed strings and attaches `metadata.userId`
- User model in Prisma schema already includes `isPro`, `stripeCustomerId`, and `stripeSubscriptionId`
- Customer portal requires prior Stripe customer creation (handled during checkout or lookup)
- Success URL: `/settings?upgraded=true`, Cancel/Return URL: `/settings`
- Focus on server-side core infrastructure; UI wiring and webhooks are in subsequent phase

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
