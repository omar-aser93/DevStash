# Current Feature: Auth Setup - NextAuth + GitHub Provider

## Status

In Progress

## Goals

- Install NextAuth v5 beta and the Prisma adapter.
- Configure split Auth.js configuration for Edge compatibility, using GitHub OAuth and JWT sessions.
- Expose Auth.js route handlers and extend the session type with the user ID.
- Protect `/dashboard/*` through Next.js 16 `proxy.ts` and redirect unauthenticated visitors to the default sign-in page.


## Notes

- Do not configure a custom sign-in page; use the NextAuth default page for testing.
- Required environment variables: `AUTH_SECRET`, `AUTH_GITHUB_ID`, and `AUTH_GITHUB_SECRET`.
- Validate by confirming `/dashboard` redirects when signed out, GitHub sign-in works, and users return to `/dashboard` after authentication.


## History

<!-- Keep this updated. Earliest to latest -->

- Project setup and boilerplate cleanup
- Completed Dashboard UI Phase 1: initialized ShadCN UI; built the dark `/dashboard` shell with centered search, New Collection and New Item actions, a clickable DS/DevStash identity group, and sidebar/main placeholders. Verified with `npm run build`.
- Completed Dashboard UI Phase 2: added collapsible desktop navigation, shadcn Sheet mobile navigation, item-type and collection links from mock data, a user area, dashboard metadata, and themed scrollbars. Verified with `npm run build`.
- Completed Dashboard UI Phase 3: built main dashboard layout with stats cards, recent collections section (with dominant item-type colored left borders and contained item-type icons), pinned items section (with item-type colored left borders), and 10 recent items list. Verified with `npm run build`.
- Completed Prisma 7 setup with Neon PostgreSQL database connection. Verified with `npm run dev`.
- completed creating queries for items and collections. and converted static dashboard & sidebar to dynamiclly fetched data.
- Fixed user-scoped tags, bounded dashboard collection queries, and added ESLint ignores for generated and auxiliary directories. Verified with Prisma schema validation, focused ESLint, and `tsc --noEmit`.

