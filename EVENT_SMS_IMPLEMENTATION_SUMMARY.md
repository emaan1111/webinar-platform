# Event SMS Reminder Implementation

## Overview
Implemented SMS functionality for Events, mirroring the Webinar SMS set up.

## Changes

### 1. Database Schema (`prisma/schema.prisma`)
- Updated `Event` model:
  - Added `smsReminderEnabled` (Boolean)
  - Added `smsReminderBody` (String)
- Added new `EventReminderSent` model to track SMS status per registration.

### 2. Event Dashboard UI (`src/app/dashboard/events/[id]/page.tsx`)
- Added SMS configuration section to the Event Settings form.
- Allows enabling/disabling SMS and customizing the message body.

### 3. API Updates
- **Event Update** (`src/app/api/events/[id]/route.ts`):
  - Updated to save `smsReminderEnabled` and `smsReminderBody`.
- **Registration** (`src/app/api/events/[id]/register/route.ts`):
  - Now creates a pending `EventReminderSent` record when a user registers.
  - Scheduled for 1 hour before the event start time.

### 4. Reminder Processing Logic (`src/lib/event-reminders.ts`)
- Created new library file to handle processing of event reminders.
- Queries `EventReminderSent` for pending records where correct time has passed.
- Sends SMS via ClickSend API.
- Supports placeholders: `{{eventTitle}}`, `{{zoomLink}}`, `{{attendeeName}}`.

### 5. Cron Job (`src/app/api/cron/process-reminders/route.ts`)
- Updated the main cron endpoint to include `processEventReminders()`.

## How it works
1. **User registers** for an event.
2. System calculates `startTime - 1 hour`.
3. System creates a `PENDING` record in `EventReminderSent`.
4. **Cron job runs** (e.g., every 5-10 mins).
5. Only if the scheduled time has passed, it sends the SMS via ClickSend.
6. Updates status to `SENT` or `FAILED`.
