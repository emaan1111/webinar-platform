# Schedule Type Behavior Fix - Making All Schedules Work Like Just-in-Time

## 🎯 Problem Statement

**User Report**: "When I have selected anything other than just-in-time schedule, the webinar is behaving totally differently. The countdown page countdown is also not correct. The webinar room is not correctly simulated, like it is in just-in-time. It needs to behave exactly like it does in just-in-time."

## 🔍 Root Cause Analysis

### How Just-in-Time Works (CORRECT):
1. **Registration**: User registers at 10:00 AM for "1 minute from registration"
2. **Countdown Page**: Shows countdown to 10:01 AM
3. **At 10:01 AM**: Auto-redirects to webinar room  
4. **Webinar Room**: Video starts at 0:00 (beginning)
5. **Late Joiner (10:05 AM)**: Video starts at ~4:00 (4 minutes in)

### How Specific/Recurring Schedules Work (INCORRECT):
1. **Registration**: User registers for "Nov 15, 11:11 AM"
2. **Countdown Page**: Shows countdown to Nov 15, 11:11 AM ✅
3. **At 11:11 AM**: Auto-redirects to webinar room ✅  
4. **Webinar Room**: Video starts at 0:00 ✅
5. **Late Joiner (11:15 AM)**: Video SHOULD start at ~4:00 but...
   - **PROBLEM**: `calculateScheduleDateTime()` returns the NEXT occurrence, not the one they registered for!
   - For recurring schedules: Returns next Sunday instead of the Sunday they registered for
   - For specific schedules: If past, returns current time instead of registered time

## 🐛 The Bug

### In `/src/lib/webinarSchedule.ts`:

```typescript
export function calculateScheduleDateTime(
  schedule: ScheduleLike,
  registration?: RegistrationLike | null,
  referenceDate: Date = new Date()
): Date {
  // ✅ CORRECT: JIT uses registration time
  if (schedule.scheduleType === 'justInTime' && schedule.minutesFromReg) {
    const regTime = registration?.registeredAt
      ? new Date(registration.registeredAt)
      : referenceDate
    return new Date(regTime.getTime() + schedule.minutesFromReg * 60000)
  }

  // ❌ PROBLEM: Specific schedules return the scheduled date, 
  // but don't store WHICH occurrence the user registered for
  if (schedule.scheduleType === 'specific' && schedule.scheduledAt) {
    return new Date(schedule.scheduledAt)
  }

  // ❌ PROBLEM: Recurring schedules calculate NEXT occurrence
  // instead of the one the user registered for
  if (schedule.scheduleType === 'recurring' && schedule.recurringPattern) {
    // This always returns the NEXT future occurrence
    // Not the one the user actually registered for!
    const next = calculateNextOccurrence(pattern, referenceDate)
    return next
  }
}
```

## 💡 Solution Strategy

We need to store **which specific occurrence** the user registered for in the `registrations` table.

### Option 1: Add `scheduledStartTime` to Registration (RECOMMENDED)

**Database Change**:
```prisma
model Registration {
  id String @id @default(cuid())
  scheduleId String?
  scheduledStartTime DateTime? // NEW: The exact time this user's webinar starts
  registeredAt DateTime
  // ... other fields
}
```

**When User Registers**:
```typescript
// For recurring: Store the exact slot they selected
if (selectedSchedule.id.includes('-slot-')) {
  const slotTime = parseSlotTime(selectedSchedule.id)
  scheduledStartTime = slotTime
}

// For specific: Store the scheduled time
else if (schedule.scheduleType === 'specific') {
  scheduledStartTime = schedule.scheduledAt
}

// For JIT: Calculate and store
else if (schedule.scheduleType === 'justInTime') {
  scheduledStartTime = new Date(Date.now() + schedule.minutesFromReg * 60000)
}

await prisma.registration.create({
  data: {
    ...
    scheduleId: baseScheduleId,
    scheduledStartTime,  // NEW: Store the exact start time
    ...
  }
})
```

**In Countdown Page**:
```typescript
// Use the stored scheduled start time
const startTime = registration.scheduledStartTime || calculateScheduleDateTime(...)
```

**In Webinar Room**:
```typescript
// Use the stored scheduled start time  
const startTime = registration.scheduledStartTime || calculateScheduleDateTime(...)
const elapsedSeconds = Math.floor((now - startTime) / 1000)
```

### Option 2: Parse Slot ID on the Fly (CURRENT WORKAROUND)

This is what the code currently tries to do but it's fragile:

```typescript
// In handleRegister():
if (scheduleId.includes('-slot-')) {
  const baseScheduleId = scheduleId.split('-slot-')[0]
  const baseSchedule = webinar.schedules.find(s => s.id === baseScheduleId)
  const slots = generateRecurringSlots(baseSchedule, maxSlots)
  const selectedSlot = slots.find(s => s.id === scheduleId)
  
  scheduleId = baseScheduleId
  selectedDateTime = selectedSlot.time.toISOString()  // ← This gets lost!
}
```

**Problem**: The `selectedDateTime` is sent in the API request but NOT stored in the database!

## 🎯 Implementation Steps

### Step 1: Update Database Schema

```bash
# Add migration
npx prisma migrate dev --name add-scheduled-start-time
```

**Migration file**:
```sql
ALTER TABLE "Registration" ADD COLUMN "scheduledStartTime" TIMESTAMP(3);
```

### Step 2: Update Registration Creation

**File**: `/src/app/w/[slug]/page-client.tsx`

In `handleRegister()` function, store the exact start time:

```typescript
// Calculate the exact start time for this registration
let scheduledStartTime: string | null = null

if (selectedSchedule!.id.includes('-slot-')) {
  // Recurring slot - extract the datetime from slot ID
  const baseScheduleId = selectedSchedule!.id.split('-slot-')[0]
  const baseSchedule = webinar.schedules.find(s => s.id === baseScheduleId)
  
  if (baseSchedule && baseSchedule.scheduleType === 'recurring') {
    const slots = generateRecurringSlots(baseSchedule, webinar.maxSchedulesToShow || 5)
    const selectedSlot = slots.find(s => s.id === selectedSchedule!.id)
    
    if (selectedSlot) {
      scheduleId = baseScheduleId
      scheduledStartTime = selectedSlot.time.toISOString()
    }
  }
} else if (selectedSchedule!.scheduleType === 'specific') {
  // Specific schedule
  scheduledStartTime = selectedSchedule!.scheduledAt
} else if (selectedSchedule!.scheduleType === 'justInTime') {
  // Just-in-time - calculate from now
  const minutesFromReg = selectedSchedule!.minutesFromReg || 5
  scheduledStartTime = new Date(Date.now() + minutesFromReg * 60000).toISOString()
}

// Send to API
const response = await fetch('/api/registrations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ...formData,
    webinarId: webinar.id,
    scheduleId: scheduleId,
    scheduledStartTime,  // NEW: Include the exact start time
  }),
})
```

### Step 3: Update API to Store Start Time

**File**: `/src/app/api/registrations/route.ts`

```typescript
export async function POST(request: Request) {
  const data = await request.json()
  
  const registration = await prisma.registration.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      webinarId: data.webinarId,
      scheduleId: data.scheduleId,
      scheduledStartTime: data.scheduledStartTime ? new Date(data.scheduledStartTime) : null,  // NEW
      timezone: data.timezone,
      gdprConsent: data.gdprConsent,
      privacyConsent: data.privacyConsent,
      marketingConsent: data.marketingConsent,
    },
  })
  
  return NextResponse.json({ registration })
}
```

### Step 4: Update Countdown Page to Use Stored Time

**File**: `/src/app/countdown/[slug]/page.tsx`

```typescript
async function getCountdownData(...) {
  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    select: { 
      id: true, 
      scheduleId: true, 
      registeredAt: true,
      scheduledStartTime: true,  // NEW: Get the stored start time
    },
  })
  
  // Use stored start time if available
  let scheduledTime: Date
  
  if (registration?.scheduledStartTime) {
    // Use the exact time stored during registration
    scheduledTime = new Date(registration.scheduledStartTime)
  } else {
    // Fallback to calculated time (for old registrations)
    scheduledTime = calculateScheduleDateTime(explicitSchedule, registration, now)
  }
  
  return {
    webinar,
    schedule: explicitSchedule,
    scheduleDateTime: scheduledTime,  // Use the correct start time
    countdownPage,
    registrationId,
  }
}
```

### Step 5: Update Webinar Room to Use Stored Time

**File**: `/src/app/room/[slug]/page.tsx`

```typescript
export default async function WebinarRoomPage({ params, searchParams }: PageProps) {
  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: {
      schedule: true,
    },
  })
  
  // Use stored start time if available
  let startTime: Date
  
  if (registration?.scheduledStartTime) {
    // Use the exact time stored during registration
    startTime = new Date(registration.scheduledStartTime)
  } else {
    // Fallback to calculated time (for old registrations)
    const { startTime: calculatedTime } = findScheduleStart(
      webinar.schedules,
      registrationMeta,
      scheduleParam ?? null
    )
    startTime = calculatedTime
  }
  
  const now = new Date()
  const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000)
  
  // Rest of the logic remains the same...
}
```

## ✅ Benefits of This Approach

1. **Consistency**: All schedule types behave identically
2. **Accuracy**: Each user gets the exact webinar session they registered for
3. **Late Joiners**: Work correctly for all schedule types (not just JIT)
4. **Countdown**: Always shows correct time for the user's specific session
5. **Replay**: Users can rejoin their same session later
6. **Future-Proof**: Supports new schedule types easily

## 🧪 Testing Checklist

### Test Scenario 1: Specific Schedule
- [ ] Register for "Nov 15, 11:11 AM"
- [ ] Countdown page shows correct countdown
- [ ] At 11:11 AM, redirects to webinar room
- [ ] Video starts at 0:00
- [ ] Join 5 minutes late (11:16 AM) - video starts at 5:00

### Test Scenario 2: Daily Recurring
- [ ] Register for "Daily at 1:01 AM" - select "Nov 14, 1:01 AM"
- [ ] Countdown page shows countdown to Nov 14, 1:01 AM (not Nov 15!)
- [ ] At Nov 14, 1:01 AM, redirects to webinar room
- [ ] Video starts at 0:00
- [ ] Join 10 minutes late - video starts at 10:00

### Test Scenario 3: Weekly Recurring
- [ ] Register for "Every Sunday at 3:33 AM" - select "Nov 16, 3:33 AM"
- [ ] Countdown page shows countdown to Nov 16, 3:33 AM (not Nov 23!)
- [ ] At Nov 16, 3:33 AM, redirects to webinar room
- [ ] Video starts at 0:00
- [ ] Join 15 minutes late - video starts at 15:00

### Test Scenario 4: Just-in-Time (Verify Not Broken)
- [ ] Register for "1 minute from registration"
- [ ] Countdown page shows correct countdown
- [ ] After 1 minute, redirects to webinar room
- [ ] Video starts at 0:00
- [ ] Join 3 minutes late - video starts at 3:00

## 📋 Files to Modify

1. `/prisma/schema.prisma` - Add `scheduledStartTime DateTime?` to Registration model
2. `/src/app/w/[slug]/page-client.tsx` - Calculate and send scheduledStartTime in registration
3. `/src/app/api/registrations/route.ts` - Store scheduledStartTime in database
4. `/src/app/countdown/[slug]/page.tsx` - Use stored scheduledStartTime for countdown
5. `/src/app/room/[slug]/page.tsx` - Use stored scheduledStartTime for video timing

---

**Status**: 🟡 Documented - Ready to implement
**Priority**: 🔴 High - Core feature broken for non-JIT schedules
**Estimated Time**: 2-3 hours
