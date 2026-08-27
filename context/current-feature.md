# Current Feature

## Status

-

## Goals

-

## Notes

-

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
