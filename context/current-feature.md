# Current Feature: Auth UI - Sign In, Register & Sign Out

## Status

In Progress

## Goals

- Build custom Sign In page at `/sign-in` with email & password inputs, "Sign in with GitHub" button, link to `/register`, form validation, and error messaging
- Build custom Register page at `/register` with name, email, password, and confirm password fields, client-side validation, submission to `POST /api/auth/register`, and redirect to `/sign-in` on success
- Update NextAuth config (`auth.config.ts`) and proxy redirect logic to use custom sign-in page (`pages: { signIn: '/sign-in' }`)
- Create reusable `UserAvatar` component handling GitHub avatar images with initials fallback
- Update bottom of sidebar and mobile navigation to display authenticated user details, clickable profile trigger (`/profile`), and dropdown menu with "Sign out"
- Verify sign-in (Credentials & GitHub), registration, sidebar user display, and sign-out flows end-to-end

## Notes

- **Sign In Page (`/sign-in`)**:
  - Email and password input fields
  - "Sign in with GitHub" OAuth button
  - Navigation link to `/register`
  - Inline error display for invalid credentials or auth errors
- **Register Page (`/register`)**:
  - Name, email, password, confirm password fields
  - Validation for password matching and valid email format
  - `POST` to `/api/auth/register` and redirect to `/sign-in` upon success
- **Avatar Logic & Component**:
  - If user has `image` (e.g. from GitHub OAuth): render image
  - Otherwise: generate uppercase initials from `name` (e.g., "Omar Mohamed" → "OM", or fallback from email)
- **Sidebar User Section**:
  - Dynamic user avatar and user name display
  - Dropdown menu on avatar/user click with "Sign out" action and link to `/profile`

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
