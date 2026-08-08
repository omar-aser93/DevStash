# Dashboard Collections Spec

## Overview

Replace the dummy collection data displayed in the main area of the dashboard (right side), with actual data from the database. It should look how it does now with the 6 cards of recent collections, but instead of using data from @lib/mock-data.ts, it should be from our Neon database using Prisma.

Do not add the items underneath yet. We will do that later.

## Requirements

- Create lib/queries/collections.ts with data fetching functions
- Fetch collections directly in server component
- Collection card border color derived from most-used content type in that collection
- Show small icons of all types in that collection
- Keep the current design. You can also reference the screenshot
- Update collection stats display

## References

Check the `@public/screenshots/dashboard-ui-main.png` screenshot if needed, but layout and design is already there.
