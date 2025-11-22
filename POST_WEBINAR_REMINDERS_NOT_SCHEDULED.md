# Post-Webinar Reminders Not Being Scheduled - ROOT CAUSE FOUND ❌

## Problem

Post-webinar/post-session reminders are **NOT being scheduled at all**, which means they will never be sent.

## Root Cause Analysis

### Current System Flow:

1. **Pre-Webinar Reminders** ✅ WORKING:
   - Scheduled when user registers → `scheduleRemindersForRegistration()`
   - Function creates `webinarReminderSent` records with `scheduledFor` time
   - Cron job picks them up and sends them

2. **Post-Webinar Reminders** ❌ NOT WORKING:
   - Templates can be created in UI (`/dashboard/webinars/[id]/reminders`)
   - BUT: There's **NO function to schedule them** when viewing session ends
   - The `scheduleRemindersForRegistration()` function ONLY handles pre-webinar reminders (filters by `minutesBefore`)
   - Cron job can't process them because they were never scheduled

### Code Evidence:

**In `src/lib/reminders.ts` line 200-224:**
```typescript
for (const template of registration.webinar.reminderTemplates) {
  // Skip if no minutesBefore set  ← THIS IS THE PROBLEM!
  if (!template.minutesBefore) continue
  
  // Calculate when this reminder should be sent
  const scheduledFor = new Date(webinarStartTime.getTime() - template.minutesBefore * 60 * 1000)

  // Only schedule if the reminder time is in the future
  if (scheduledFor > now) {
    remindersToCreate.push({
      templateId: template.id,
      registrationId: registration.id,
      scheduledFor,
      status: 'PENDING',
      channel: template.channel
    })
  }
}
```

**Post-webinar templates have `minutesAfter`, NOT `minutesBefore`**, so they're all skipped!

### What's Missing:

1. **No trigger when viewing session ends** - Need to detect when user finishes watching
2. **No scheduling function** - Need `schedulePostWebinarRemindersForSession()` function
3. **No watch time validation** - Need to check `minWatchedMinutes` or `minWatchedPercentage`
4. **No session end tracking** - Need to track when each user's session actually ends

## Solution Required

### 1. Create Session End Tracking

Track when a user's viewing session ends. This should happen when:
- User leaves the webinar page (navigates away)
- Webinar video finishes playing
- User closes the browser tab
- Session times out

### 2. Create Post-Webinar Scheduling Function

```typescript
/**
 * Schedule post-webinar reminders for a registration after their session ends
 * Called when: User finishes watching, leaves webinar, or session times out
 */
export async function schedulePostWebinarRemindersForSession(
  registrationId: string,
  watchedMinutes: number,
  watchedPercentage: number
): Promise<void> {
  try {
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        webinar: {
          include: {
            reminderTemplates: {
              where: { 
                isActive: true,
                type: 'post_webinar'
              }
            }
          }
        }
      }
    })

    if (!registration) {
      console.log('⚠️ Registration not found')
      return
    }

    const now = new Date()
    const remindersToCreate: any[] = []

    for (const template of registration.webinar.reminderTemplates) {
      // Check if user watched enough to qualify
      if (template.minWatchedMinutes && watchedMinutes < template.minWatchedMinutes) {
        console.log(`⏭️ Skipped: User watched ${watchedMinutes} min, need ${template.minWatchedMinutes} min`)
        continue
      }

      if (template.minWatchedPercentage && watchedPercentage < template.minWatchedPercentage) {
        console.log(`⏭️ Skipped: User watched ${watchedPercentage}%, need ${template.minWatchedPercentage}%`)
        continue
      }

      // Calculate when to send (X minutes after session end)
      const minutesAfter = template.minutesAfter || 0
      const scheduledFor = new Date(now.getTime() + minutesAfter * 60 * 1000)

      remindersToCreate.push({
        templateId: template.id,
        registrationId: registration.id,
        scheduledFor,
        status: 'PENDING',
        channel: template.channel
      })

      console.log(`  ⏰ Scheduled post-webinar reminder: ${minutesAfter} minutes after session end`)
    }

    if (remindersToCreate.length > 0) {
      await prisma.webinarReminderSent.createMany({
        data: remindersToCreate
      })
      console.log(`✅ Scheduled ${remindersToCreate.length} post-webinar reminders`)
    }
  } catch (error) {
    console.error('❌ Failed to schedule post-webinar reminders:', error)
    throw error
  }
}
```

### 3. Track Session Completion in WebinarTracker

Add to `src/lib/tracking.ts`:
```typescript
async endSession() {
  if (this.ended) return
  
  this.ended = true
  console.log('[Tracking] Session ended')
  
  // Calculate watch stats
  const watchedMinutes = this.watchedTime / 60
  const watchedPercentage = this.videoDuration 
    ? (this.watchedTime / this.videoDuration) * 100 
    : 0
  
  // Schedule post-webinar reminders if user watched enough
  if (this.registrationId && watchedMinutes > 0) {
    try {
      const { schedulePostWebinarRemindersForSession } = await import('./reminders')
      await schedulePostWebinarRemindersForSession(
        this.registrationId,
        watchedMinutes,
        watchedPercentage
      )
    } catch (error) {
      console.error('[Tracking] Failed to schedule post-webinar reminders:', error)
    }
  }
}
```

### 4. Call endSession() When User Leaves

In `src/app/w/[slug]/live/page-client.tsx`:
```typescript
useEffect(() => {
  const handleBeforeUnload = () => {
    trackerRef.current?.endSession()
  }

  const handleVisibilityChange = () => {
    if (document.hidden) {
      trackerRef.current?.endSession()
    }
  }

  window.addEventListener('beforeunload', handleBeforeUnload)
  document.addEventListener('visibilitychange', handleVisibilityChange)

  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
}, [])
```

## Current Workaround

There's an OLD post-session SMS system (`autoSendPostSessionSMS` in webinar settings) that works differently:
- Stores SMS config directly on the webinar table
- Scheduled based on `scheduledStartTime + duration + minutesAfter`
- Doesn't use the reminder templates system
- Only sends ONE SMS per webinar (not flexible like reminder templates)

## Why This Wasn't Caught

1. **UI exists** - Users can create post-webinar reminder templates
2. **API works** - Templates are saved to database correctly
3. **Cron job runs** - But has no reminders to process
4. **No errors** - System "works", just doesn't create the reminders

## Impact

- Users create post-webinar reminder templates thinking they'll work
- NO post-webinar reminders are ever sent
- Watch time filters (`minWatchedMinutes`, `minWatchedPercentage`) are never checked
- Feature appears broken but silently fails

## Fix Priority

**CRITICAL** - Core feature is completely non-functional

## Files That Need Changes

1. `src/lib/reminders.ts` - Add `schedulePostWebinarRemindersForSession()` function
2. `src/lib/tracking.ts` - Add `endSession()` method and call scheduling
3. `src/app/w/[slug]/live/page-client.tsx` - Hook up session end detection

## Testing Plan

1. Create a post-webinar reminder template
2. Watch a webinar for required time
3. Leave the webinar page
4. Check database: `SELECT * FROM webinar_reminder_sent WHERE template_id = 'post-template-id'`
5. Verify reminder was scheduled with correct `scheduledFor` time
6. Wait for `scheduledFor` time to pass
7. Run cron job: `POST /api/cron/process-reminders`
8. Verify reminder was sent

## Related Issues

- Post-session SMS automation (`autoSendPostSessionSMS`) works but uses different system
- Should eventually migrate old system to use reminder templates
- Need unified approach for all post-viewing communications
