# Side Menu Chat Notification

## Feature
Added a visual "red dot" indicator to the "Chat Moderation" item in the dashboard side menu when there are pending messages requiring approval.

## Implementation
1.  **API Route**: Created `src/app/api/chat/pending-count/route.ts` to efficiently fetch the count of unapproved messages.
    -   Criteria: `isScripted: false`, `isAI: false`, `isApproved: false`.
2.  **Dashboard Layout**: Updated `src/components/dashboard/DashboardLayout.tsx`.
    -   Added state `pendingChatCount`.
    -   Added polling mechanism (every 30 seconds) to keep count updated.
    -   Modified sidebar rendering (Mobile & Desktop) to display a pulsing red dot when count > 0.
