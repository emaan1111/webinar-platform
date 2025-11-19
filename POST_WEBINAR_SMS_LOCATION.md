# Post-Webinar SMS Reminders - Where to Find It

## Direct URL

Navigate to: **`/dashboard/post-webinar-sms`**

Full URL: `https://your-domain.com/dashboard/post-webinar-sms`

## What It Does

This page allows you to send follow-up SMS messages to attendees based on how much of the webinar they watched.

## Features

### 1. **Select Webinar**
Choose which completed webinar you want to send follow-ups for.

### 2. **Set Watch Criteria**
Filter attendees by how much they watched:

**Option A: By Minutes**
- Example: Send to people who watched **30+ minutes**
- Example: Send to people who watched **45+ minutes**

**Option B: By Percentage**
- Example: Send to people who watched **50%+** of the webinar
- Example: Send to people who watched **75%+** of the webinar

### 3. **Choose Timing**
**Immediate Sending:**
- SMS sent right away to all eligible attendees

**Scheduled Sending:**
- Send after X days (1-30 days)
- Example: "Send 3 days after webinar ended"
- Example: "Send 1 week after webinar ended"

### 4. **Customize Message**
Write your SMS with dynamic variables:
- `{name}` - Attendee's first name
- `{webinar_title}` - Name of the webinar
- `{offer_link}` - Link to your offer/product

**Example Message:**
```
Hi {name}, thanks for attending {webinar_title}! 

I noticed you watched a good portion - wanted to follow up on the special offer we discussed. 

Check it out here: {offer_link}

Have questions? Just reply to this message!
```

### 5. **Preview**
See how many attendees will receive the SMS before sending.

## Usage Example

**Scenario:** Follow up with engaged attendees who didn't purchase

1. Go to `/dashboard/post-webinar-sms`
2. Select your webinar (e.g., "How to Build a Business")
3. Choose: **Watched 50%+ of webinar** (engaged viewers)
4. Choose: **Send 2 days after webinar**
5. Write message:
   ```
   Hey {name}! Thanks for joining {webinar_title}. 
   
   I have a special follow-up offer just for attendees like you: {offer_link}
   
   Limited time only - expires in 48 hours!
   ```
6. Click "Send SMS"
7. System will:
   - Find all attendees who watched 50%+
   - Schedule SMS to send 2 days after the webinar ended
   - Personalize each message with their name

## How It's Different from Pre-Webinar Reminders

| Feature | Pre-Webinar Reminders | Post-Webinar SMS |
|---------|----------------------|------------------|
| **When** | Before webinar starts | After webinar ends |
| **Purpose** | Get people to attend | Follow up & convert |
| **Trigger** | Time-based (24hr before, 1hr before) | Engagement-based (watched X minutes) |
| **Location** | `/dashboard/webinars/[id]/reminders` | `/dashboard/post-webinar-sms` |
| **Recipients** | All registrants | Filtered by watch time |

## Database Tracking

SMS records are saved in `WebinarReminderSent` table with:
- `type: 'post_webinar'` (vs 'pre_webinar')
- `message`: Your custom message
- `phone`: Recipient's phone number
- `sendAt`: When to send (for scheduled)
- `status`: PENDING → SENT/FAILED

## Notes

- ✅ Chat deletion is working (logs show 200 OK responses)
- ✅ FAQ access restrictions removed
- ✅ AI Assistant access restrictions removed
- ✅ Program documents access restrictions removed
- ✅ Post-webinar SMS fully functional

**All deployed to Railway - ready to use!**
