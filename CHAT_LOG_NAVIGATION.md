# Chat Log Navigation Update

## Feature
Enabled navigation from the Chat Log dashboard to individual Attendee Profiles.

## Implementation
- Modified `src/app/dashboard/chat/page.tsx`
- Added `next/link` import
- Wrapped the user name display in a `<Link>` component
- Validated `registrationId` availability in `src/app/api/chat/route.ts`

## Usage
When viewing the Chat Log at `/dashboard/chat`:
1. Located a message from a user
2. Click their name (now a link if they are a registered attendee)
3. Navigate directly to their Attendee View Manager profile (`/dashboard/attendees/[id]`)

## Note
- If `registrationId` is missing (e.g. for some test data or purely anonymous users), the name renders as plain text.
