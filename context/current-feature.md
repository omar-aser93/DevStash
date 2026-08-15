# Current Feature: Auth Credentials - Email/Password Provider

## Status

In Progress

## Goals

- Ensure `password` field exists in the `User` model via Prisma migration if not already present
- Update `auth.config.ts` with Credentials provider placeholder (`authorize: () => null`)
- Update `auth.ts` to implement Credentials authentication with email lookup and bcryptjs password verification
- Create registration API route at `POST /api/auth/register` (validate inputs, verify passwords match, check existing user, hash password, create user)
- Test registration and email/password sign-in flow redirecting to `/dashboard`
- Verify GitHub OAuth authentication continues to work seamlessly alongside Credentials provider

## Notes

- **Password Hashing**: Use `bcryptjs` for secure password hashing and comparison
- **NextAuth Split Pattern**:
  - `auth.config.ts`: Contains lightweight configuration with `Credentials({ authorize: () => null })` placeholder for middleware/Edge compatibility
  - `auth.ts`: Overrides Credentials provider with full Node.js runtime logic (Prisma queries + bcryptjs comparison)
- **Registration Endpoint**:
  - Accepts `name`, `email`, `password`, `confirmPassword`
  - Validates matching passwords and existing accounts
  - Creates user in database with hashed password

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
