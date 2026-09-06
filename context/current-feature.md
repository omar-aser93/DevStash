# Current Feature: Billing Migration

## Status

In Progress

## Goals

- Migrate Stripe checkout and verified webhooks to persist idempotent `Subscription` and `Payment` records while retaining legacy compatibility fields.
- Migrate the existing one-time Paymob Intention flow to pending/paid payment records and temporary, time-limited local entitlement.
- Establish subscription-backed entitlement and use it for application access and usage enforcement without changing current free-tier limits.
- Preserve billing UI country routing, protect existing users, harden webhook handling, and verify each phase before final legacy-field cleanup.

## Notes

- Spec: `context/features/billing-agentic-implementation-spec.md`.
- All Phases 1 through 9 are implemented and verified with 44 passing Vitest unit tests, ESLint (0 errors), and Next.js production build.
- Provider webhooks remain the source of truth; redirects never grant Pro directly.
- Compatibility fields (`User.isPro`, `stripeCustomerId`, `stripeSubscriptionId`) are retained to ensure zero regressions during transition.
- Legacy Stripe users can be migrated and verified using `lib/billing/migration.ts` or `scripts/migrate-existing-billing.ts`.
- Phase 10 final cleanup is deferred until external provider testing confirms complete operational stability.

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
- Completed Stripe Integration Phase 2: implemented Stripe webhook handler for checkout and subscription lifecycle events, added feature gating and free-tier limits to createItem, createCollection, and upload routes, built BillingSettings UI component with usage progress meters and Stripe Customer Portal integration, and added upgrade success toast. Verified with 18 Vitest unit tests, ESLint, and Next.js production build.
- Completed Billing Migration Phases 1-9: unified `Subscription` and `Payment` Prisma models, Stripe & Paymob webhook migration and idempotency, unified entitlement system, application Pro check migration across actions and upload API, existing user migration tools, Paymob recurring helpers, and structured webhook logging. Verified with 44 Vitest tests, ESLint (0 errors), and Next.js production build.
