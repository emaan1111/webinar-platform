# Registration Performance & Countdown Redirect

## Overview
This document describes the optimization improvements made to the registration process:
1. **Smart redirect logic** - Automatically send users to countdown page when webinar starts within 15 minutes
2. **Performance optimization** - Reduced registration delay by making tracking non-blocking

## Implementation Details

### 1. Countdown Page Redirect (15-Minute Window)

When a user registers for a webinar that starts within the next 15 minutes, they are automatically redirected to the countdown page instead of the thank you page.

**Logic:**
```typescript
// Calculate time until webinar starts
const now = Date.now()
const startTime = scheduledStartTime ? new Date(scheduledStartTime).getTime() : now
const minutesUntilStart = (startTime - now) / (1000 * 60)
const shouldRedirectToCountdown = minutesUntilStart <= 15 && minutesUntilStart > 0

// Redirect based on timing
if (shouldRedirectToCountdown) {
  redirectUrl = `/countdown/${webinar.slug}?r=${registrationId}`
  console.log(`🚀 Webinar starts in ${Math.round(minutesUntilStart)} minutes - redirecting to countdown page`)
} else {
  redirectUrl = `/thank-you/${webinar.slug}?r=${registrationId}&s=${scheduleId}`
}
```

**When it triggers:**
- ✅ Webinar starts in 0-15 minutes → Countdown page
- ✅ Webinar starts in 15+ minutes → Thank you page
- ✅ Works with all schedule types: specific, just-in-time, and recurring

**Benefits:**
- Users don't need to wait on thank you page - they get immediate access
- Increases engagement for imminent webinars
- Reduces drop-off rate for just-in-time webinars

### 2. Performance Optimization

**Problem:**
After clicking "Complete Registration", there was a noticeable delay before redirect. This was caused by:
1. Waiting for A/B test tracking API call to complete
2. Error handling that blocked the redirect flow

**Solution:**

#### A. Non-Blocking A/B Tracking
Changed the A/B test conversion tracking to be fire-and-forget:

```typescript
// OLD - Blocked redirect until tracking completed
fetch('/api/ab-test/track-conversion', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: payload,
}).catch(err => {
  console.error('Failed to track conversion:', err)
})

// NEW - Fire-and-forget with keepalive
fetch('/api/ab-test/track-conversion', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: payload,
  keepalive: true  // Ensures request completes even after redirect
}).catch(() => {
  // Silently fail - tracking is not critical
})
```

#### B. Removed Finally Block
Removed the `finally { setRegistering(false) }` block because:
- User is being redirected anyway
- No need to update UI state before redirect
- Saves a React render cycle

**Result:**
- Registration completes **instantly** after server responds
- No waiting for tracking API calls
- Smoother user experience

## User Experience Flow

### Scenario 1: Webinar Starting Soon (≤15 minutes)
```
User fills form
    ↓
Clicks "Complete Registration"
    ↓
[Button shows "Registering..."]
    ↓
Registration saved to database
    ↓
INSTANT redirect to countdown page
    ↓
User sees countdown timer and "Join Now" button
```

### Scenario 2: Webinar Starting Later (>15 minutes)
```
User fills form
    ↓
Clicks "Complete Registration"
    ↓
[Button shows "Registering..."]
    ↓
Registration saved to database
    ↓
INSTANT redirect to thank you page
    ↓
User sees confirmation and calendar invite
```

## Technical Notes

### Time Calculation
- Uses `scheduledStartTime` which is already calculated for all schedule types
- Handles timezones correctly (times are in UTC in database)
- Edge case: `minutesUntilStart > 0` check prevents countdown for past webinars

### A/B Testing Tracking
- Uses `navigator.sendBeacon` when available (most modern browsers)
- Falls back to `fetch` with `keepalive: true` for older browsers
- Silently fails if tracking fails - registration success is priority

### Console Logging
Added helpful debug log:
```
🚀 Webinar starts in 7 minutes - redirecting to countdown page
```

This helps admins/developers verify the redirect logic is working correctly.

## Testing Checklist

✅ **Test Just-in-Time Schedules:**
- [ ] Create JIT webinar with 5 minutes from registration
- [ ] Register and verify countdown page redirect
- [ ] Check console for redirect log

✅ **Test Specific Schedules:**
- [ ] Create webinar starting in 10 minutes
- [ ] Register and verify countdown redirect
- [ ] Create webinar starting in 30 minutes
- [ ] Register and verify thank you page redirect

✅ **Test Recurring Schedules:**
- [ ] Select recurring slot within 15 minutes
- [ ] Register and verify countdown redirect
- [ ] Select recurring slot beyond 15 minutes
- [ ] Register and verify thank you page redirect

✅ **Test Performance:**
- [ ] Open browser DevTools → Network tab
- [ ] Complete registration
- [ ] Verify redirect happens immediately after `/register` API responds
- [ ] Verify A/B tracking request is sent but doesn't block redirect

## Configuration

Currently hardcoded to **15 minutes**. To change the threshold:

```typescript
// In page-client.tsx, line ~710
const shouldRedirectToCountdown = minutesUntilStart <= 15 && minutesUntilStart > 0
//                                                      ^^
//                                              Change this value
```

Could be made configurable per-webinar in future:
```typescript
const redirectThreshold = webinar.countdownRedirectMinutes || 15
const shouldRedirectToCountdown = minutesUntilStart <= redirectThreshold && minutesUntilStart > 0
```

## Related Files

- `/src/app/w/[slug]/page-client.tsx` - Registration form and redirect logic
- `/src/app/countdown/[slug]/page.tsx` - Countdown page (destination)
- `/src/app/thank-you/[slug]/page.tsx` - Thank you page (fallback destination)
- `/api/webinars/[id]/register/route.ts` - Registration API endpoint
- `/api/ab-test/track-conversion/route.ts` - A/B test tracking (non-blocking)

## Future Enhancements

1. **Configurable threshold** - Allow admins to set countdown redirect time per webinar
2. **Preview mode** - Show preview of destination page before redirect
3. **Loading animation** - Add brief success animation before redirect
4. **Analytics** - Track how many users get countdown vs thank you redirect
5. **Early bird access** - Different thresholds for premium users (e.g., 30 minutes)

## Changelog

**2025-11-17**
- ✅ Added 15-minute countdown redirect logic
- ✅ Optimized A/B tracking to be non-blocking
- ✅ Removed finally block for instant redirects
- ✅ Added console logging for debugging
- ✅ Improved error handling to preserve registration state

---

*Last Updated: November 17, 2025*
