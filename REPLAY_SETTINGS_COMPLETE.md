# Replay Settings Implementation - COMPLETE ✅

## Overview
Added database fields and admin UI for controlling webinar replay availability and expiration settings.

## Database Schema Changes

### Added to `Webinar` model in `prisma/schema.prisma`:
```prisma
// Replay Settings
replayEnabled       Boolean   @default(true)  // Master toggle for replay availability
replayDurationDays  Int?                      // How many days after user's session
replayExpiresAt     DateTime?                 // Absolute expiration date (optional override)
```

### Migration Status:
✅ Schema updated with `prisma db push`
✅ Prisma client regenerated with new types

---

## Admin UI Implementation

### Location:
`/src/app/dashboard/webinars/[id]/edit/page.tsx`

### New UI Section: "Replay Settings"
Added after the "Webinar Features" card:

#### Features:
1. **Enable/Disable Replay Toggle**
   - Master switch to control replay availability
   - Shows/hides replay configuration when toggled

2. **Replay Duration Setting (Days)**
   - Number input (1-365 days)
   - Calculates expiration from attendee's **scheduled session time**
   - Example: If set to 7 days, attendee registered for 3:00 PM session on Jan 1 can watch until Jan 8, 3:00 PM

3. **Absolute Expiration Override (Optional)**
   - datetime-local input for setting a fixed expiration date
   - Overrides duration setting if provided
   - Applies to ALL attendees regardless of registration time

#### Visual Design:
- Toggle with explanatory text
- Nested settings only visible when replay is enabled
- Blue background for settings area
- Example use case in bordered box
- Clear explanations of behavior

---

## Backend Implementation

### API Endpoint Updates:
`/src/app/api/webinars/[id]/route.ts`

#### Added to `allowedFields` array:
```typescript
'replayEnabled',
'replayDurationDays',
'replayExpiresAt',
```

### Form Submission:
- Edit page now sends replay settings with webinar updates
- Properly handles null values for optional fields

---

## Replay Page Integration

### Location:
`/src/app/w/[slug]/replay/page.tsx`

### Expiration Logic (Priority Order):

1. **Absolute Expiration (Highest Priority)**
   ```typescript
   if (webinar.replayExpiresAt) {
     replayExpiresAt = webinar.replayExpiresAt.toISOString()
   }
   ```

2. **Duration-Based from User's Session**
   ```typescript
   else if (webinar.replayDurationDays && scheduledSession?.scheduledAt) {
     const sessionDate = new Date(scheduledSession.scheduledAt)
     const expirationDate = new Date(sessionDate.getTime() + webinar.replayDurationDays * 24 * 60 * 60 * 1000)
     replayExpiresAt = expirationDate.toISOString()
   }
   ```

3. **Fallback: First Schedule + Duration**
   ```typescript
   else if (webinar.replayDurationDays && webinar.schedules[0]?.scheduledAt) {
     const firstSchedule = new Date(webinar.schedules[0].scheduledAt)
     const expirationDate = new Date(firstSchedule.getTime() + webinar.replayDurationDays * 24 * 60 * 60 * 1000)
     replayExpiresAt = expirationDate.toISOString()
   }
   ```

### Access Control:

#### Replay Disabled:
Shows message: "Replay Not Available" with link to registration page

#### Replay Expired:
Shows message with:
- "Replay Expired" heading
- Exact expiration date and time
- Link to check upcoming sessions

---

## User Experience Flow

### Admin (Webinar Creator):
1. Go to **Dashboard → Webinars → [Webinar] → Edit**
2. Scroll to **"🎬 Replay Settings"** section
3. Toggle **"Enable Replay Access"** (on by default)
4. Set **Replay Duration** (e.g., 7 days)
5. Optionally set **Absolute Expiration Date** for hard cutoff
6. Click **"Update Webinar"**

### Attendee (Replay Viewer):
1. Register for a session (e.g., 3:00 PM on Jan 1, 2025)
2. After session ends, can access replay at `/w/[slug]/replay`
3. Sees countdown banner: "REPLAY ACCESS EXPIRES IN X days Y hours Z minutes"
4. Can watch until Jan 8, 2025 at 3:00 PM (7 days after their session)
5. After expiration, sees "Replay Expired" message

---

## Key Features

### ✅ Personalized Expiration
Each attendee gets their own expiration based on when they registered for their specific session, not the webinar end time.

### ✅ Flexible Override
Webinar creators can set an absolute expiration date that overrides the duration setting for all attendees.

### ✅ Visual Feedback
- Countdown banner in replay shows exact time remaining
- Admin UI shows example calculation
- Clear error messages when expired or disabled

### ✅ Proper Fallbacks
- If no user session found, uses first schedule + duration
- If no expiration set, replay remains available indefinitely
- Graceful handling of missing data

---

## Testing Checklist

- [x] Database schema migration successful
- [x] Prisma client regenerated
- [x] Admin UI displays correctly
- [x] Form submission includes replay fields
- [x] API endpoint accepts and saves replay fields
- [ ] Test replay disabled state (user sees error)
- [ ] Test replay expired state (user sees expiration message)
- [ ] Test countdown accuracy in replay page
- [ ] Test personalized expiration (different sessions)
- [ ] Test absolute expiration override
- [ ] Test edge cases (no sessions, missing data)

---

## Files Modified

1. ✅ `prisma/schema.prisma` - Added replay fields
2. ✅ `src/app/dashboard/webinars/[id]/edit/page.tsx` - Added admin UI
3. ✅ `src/app/api/webinars/[id]/route.ts` - Added API support
4. ✅ `src/app/w/[slug]/replay/page.tsx` - Integrated expiration logic

---

## Next Steps (Optional Enhancements)

1. **Email Notifications**
   - Send "Replay Available" email after webinar ends
   - Send "Replay Expiring Soon" reminder (e.g., 1 day before)

2. **Analytics**
   - Track replay view count per webinar
   - Track completion rate in replay mode
   - Show "expired access attempts" metric

3. **Extended Features**
   - Replay password protection
   - Replay download option (with expiration)
   - Different replay videos for different segments

---

## Implementation Notes

### Personalized Expiration Calculation:
The key insight is using `scheduledSession.scheduledAt` (the time of the user's specific session) rather than the webinar's overall end time. This ensures:

- Fair access for all attendees
- Encourages registration for specific sessions
- Prevents early registrants from losing access

### Why Three Priority Levels?
1. **Absolute Expiration**: For hard deadlines (e.g., product launch ends)
2. **Session-Based**: Standard behavior for most webinars
3. **Fallback**: Ensures replay works even with incomplete data

### Database Design:
- `replayEnabled`: Boolean for quick on/off
- `replayDurationDays`: Nullable Int for flexibility (null = no expiration)
- `replayExpiresAt`: Nullable DateTime for overrides (null = use duration)

---

## Status: ✅ COMPLETE

All core functionality implemented and ready for testing. TypeScript types will refresh after server restart.

**Deployment Note**: Remember to restart Next.js dev server to pick up new Prisma types.
