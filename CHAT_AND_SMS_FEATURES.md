# Chat Deletion & Post-Webinar SMS Features

## ✅ Feature 1: Delete All / Delete Selected Chat Messages

### New Capabilities

#### 1. **Delete Selected Messages**
- Select multiple messages using checkboxes
- Click "Delete Selected" in bulk actions bar
- Permanently removes selected messages from database
- Confirmation dialog prevents accidental deletion

#### 2. **Delete All Filtered Messages**
- New "Delete All (X)" button in header
- Deletes ALL messages currently visible with active filters
- Works with any filter combination (pending, approved, scripted, etc.)
- Shows count of messages that will be deleted
- Double confirmation for safety

### Usage

**Delete Selected:**
1. Go to `/dashboard/chat`
2. Check boxes next to messages you want to delete
3. Click "Delete Selected" button
4. Confirm deletion
5. Messages removed immediately

**Delete All Filtered:**
1. Go to `/dashboard/chat`
2. Apply filters (e.g., "Pending", specific webinar)
3. Click "Delete All (X)" button in top right
4. Confirm you want to delete ALL filtered messages
5. All matching messages deleted

### Safety Features
- ⚠️ **Double confirmation** with clear warnings
- Shows exact count of messages to be deleted
- Explains current filter being applied
- Cannot be undone warning
- Success confirmation after deletion

---

## ✅ Feature 2: Post-Webinar SMS Reminders

### Overview
Send SMS reminders to attendees who watched your webinar up to a specific point. Perfect for re-engagement and follow-up offers.

### Access
Navigate to: **Dashboard → Post-Webinar SMS** (`/dashboard/post-webinar-sms`)

### Configuration Options

#### 1. **Select Webinar**
- Dropdown shows only completed webinars
- Displays attendee count for each webinar

#### 2. **Watch Criteria**
Choose how to filter attendees:

**Option A: By Minutes Watched**
- Set minimum minutes (e.g., 30 minutes)
- Only attendees who watched at least X minutes get SMS

**Option B: By Percentage Watched**
- Set minimum percentage (e.g., 50%)
- Only attendees who watched at least X% get SMS

#### 3. **Send Timing**
**Immediate:**
- Sends SMS right now
- Processes in real-time
- Get instant confirmation

**Scheduled:**
- Schedule for X days in the future (1-30 days)
- SMS queued in database
- Sent by cron job at scheduled time

#### 4. **Message Customization**
Personalize your SMS with variables:
- `{name}` - Attendee's first name
- `{webinar_title}` - Your webinar title
- `{offer_link}` - Custom offer URL

**Example:**
```
Hi {name}! Thanks for attending {webinar_title}. 
We have a special offer just for you: {offer_link}
```

### How It Works

1. **Select completed webinar**
2. **Set watch criteria** (30 minutes or 50%)
3. **Choose timing** (immediate or scheduled)
4. **Customize message** with variables
5. **Review preview** showing estimate
6. **Click "Send SMS Now"** or "Schedule SMS"
7. **Confirmation** with recipient count

### Examples

**Use Case 1: Immediate Follow-Up**
- **Scenario:** Webinar just ended, send offer to engaged attendees
- **Settings:**
  - Watched: 60%+ of webinar
  - Timing: Immediate
  - Message: "Thanks for attending! Here's your exclusive 50% off code..."

**Use Case 2: Delayed Nurture**
- **Scenario:** Send reminder 3 days after webinar
- **Settings:**
  - Watched: 30+ minutes
  - Timing: Scheduled in 3 days
  - Message: "Hi {name}! Still interested in {offer}? Last chance..."

### Technical Details

#### API Endpoint
`POST /api/reminders/post-webinar`

**Request Body:**
```json
{
  "webinarId": "webinar_id",
  "watchedMinimum": 30,
  "watchedPercentage": null,
  "message": "Hi {name}! Thanks for attending...",
  "sendTiming": "immediate",
  "scheduledDays": null
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sent 15 SMS reminders",
  "sent": 15,
  "eligibleAttendees": 15,
  "sendAt": "2025-11-19T10:30:00.000Z"
}
```

#### Database Schema
Updated `WebinarReminderSent` model:
- Added `type` field: `'pre_webinar'` or `'post_webinar'`
- Added `message` field for direct content
- Added `phone` field for direct SMS
- Made `templateId` optional
- Added `sendAt` field for scheduling

#### Filtering Logic
```typescript
// By minutes
if (watchedMinutes >= watchedMinimum) {
  // Eligible
}

// By percentage
const percentage = (watchedSeconds / totalSeconds) * 100
if (percentage >= watchedPercentage) {
  // Eligible
}
```

### Database Changes Required

Run migration to update schema:
```bash
npx prisma migrate dev --name add-post-webinar-reminders
npx prisma generate
```

### Configuration

Ensure these environment variables are set:
- `CLICK_SEND_USERNAME` - ClickSend API username
- `CLICK_SEND_API_KEY` - ClickSend API key
- `CLICK_SEND_FROM` - Sender phone number

### Cron Job Integration

For scheduled reminders, the existing cron job processes them:
- Runs every 5 minutes: `/api/cron/process-reminders`
- Checks for `status: 'SCHEDULED'` and `sendAt <= now`
- Sends SMS and updates status to `SENT`

### Limitations

1. **SMS Length:** 160 characters maximum
2. **Phone Numbers:** Must be valid format in database
3. **ClickSend:** Requires active account with credits
4. **Watch Data:** Requires `lastWatchedPosition` tracking enabled

### Future Enhancements

1. **Email Support:** Send emails instead of/in addition to SMS
2. **A/B Testing:** Test different messages
3. **Analytics:** Track click-through rates
4. **Segments:** Create saved audience segments
5. **Templates:** Save/reuse message templates
6. **Bulk Upload:** Import custom recipient lists

---

## 📊 Summary

### Chat Deletion
- ✅ Delete selected messages (bulk)
- ✅ Delete all filtered messages
- ✅ Safety confirmations
- ✅ Real-time UI updates

### Post-Webinar SMS
- ✅ Filter by watch time (minutes or percentage)
- ✅ Immediate or scheduled sending
- ✅ Message personalization
- ✅ Recipient estimation
- ✅ Cron job integration

### Files Modified
1. `/src/app/dashboard/chat/page.tsx` - Added delete functions
2. `/src/app/dashboard/post-webinar-sms/page.tsx` - New SMS page
3. `/src/app/api/reminders/post-webinar/route.ts` - New API endpoint
4. `/prisma/schema.prisma` - Updated reminder model

### Next Steps
1. Run database migration
2. Test chat deletion features
3. Configure ClickSend credentials
4. Test post-webinar SMS flow
5. Set up cron job for scheduled sends

---

**Status:** ✅ COMPLETE  
**Ready for Testing:** Yes  
**Requires Migration:** Yes (`npx prisma migrate dev`)
