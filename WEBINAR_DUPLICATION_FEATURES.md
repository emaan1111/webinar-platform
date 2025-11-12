# Webinar Duplication - Complete Feature List

## ✅ What Gets Duplicated

When you duplicate a webinar, the following items are automatically copied:

### Core Webinar Data
- ✅ **Title** (with "(Copy)" suffix)
- ✅ **Slug** (auto-generated unique slug)
- ✅ **Description**
- ✅ **Duration**
- ✅ **Thumbnail**
- ✅ **Video settings** (Vimeo ID, URL, duration)
- ✅ **Feature flags** (hasReplay, hasOffers, hasChat, hasReactions)

### Registration Settings
- ✅ **Max schedules to show**
- ✅ **Registration page ID**
- ✅ **Thank you page template ID**
- ✅ **Countdown page ID**

### A/B Testing Configuration
- ✅ **A/B testing enabled flag**
- ✅ **Traffic split percentage**
- ✅ **Test configurations** (registration page, schedule, offer, video)
- ✅ **Variant IDs** (Page A/B, Schedule A/B, Offer A/B, Video A/B)

### Schedules
- ✅ **All webinar schedules**
  - Schedule type (specific, recurring, just-in-time)
  - Scheduled date/time (automatically moved 7 days forward)
  - Timezone settings
  - Recurring patterns
  - Active status

### Offers
- ✅ **All webinar offers**
  - Title and description
  - Price
  - CTA text and URL
  - Video timestamp (when offer appears)
  - Hide after settings
  - Active status

### **Chat Messages** 🆕
- ✅ **All chat messages**
  - Message text
  - Video timestamp (when message appears)
  - Scripted flag
  - Hidden flag
  - User name and ID

### **Reactions** 🆕
- ✅ **All reactions**
  - Reaction type (like, love, wow, etc.)
  - Video timestamp
  - Scripted flag
  - Hidden flag
  - User name and ID

### FAQs
- ✅ **All FAQs**
  - Question
  - Answer
  - Sort order

## ❌ What Does NOT Get Duplicated

### Not Copied (Intentionally)
- ❌ **Registrations** - Each webinar needs fresh registration data
- ❌ **Analytics** - Analytics start fresh for the new webinar
- ❌ **Attendee sessions** - Session tracking starts fresh
- ❌ **Real attendee data** - Only scripted messages/reactions are copied

### Reset to Defaults
- 🔄 **Status** - Always set to DRAFT (even if original is LIVE)
- 🔄 **Recording URL** - Not copied (each webinar gets its own recording)

## How It Works

### Endpoint
```
POST /api/webinars/[id]/duplicate
```

### Process
1. **Fetch Original**: Gets webinar with all related data
   ```typescript
   include: {
     schedules: true,
     offers: true,
     chatMessages: true,    // ✅ Included
     reactions: true,        // ✅ Included
     faqs: true,
     bonusResources: true
   }
   ```

2. **Generate Unique Slug**: Creates unique slug like `webinar-name-copy` or `webinar-name-copy-2`

3. **Copy Data**: Maps all fields to new webinar structure

4. **Create Nested Relations**: Uses Prisma nested create for all related data

5. **Return Result**: Returns new webinar with all copied data

### Example: Chat Message Duplication
```typescript
if (originalWebinar.chatMessages && originalWebinar.chatMessages.length > 0) {
  webinarData.chatMessages = {
    create: originalWebinar.chatMessages.map((message: any) => ({
      message: message.message,
      videoTimestamp: message.videoTimestamp,
      isScripted: message.isScripted || false,
      isHidden: message.isHidden || false,
      userName: message.userName,
      userId: message.userId
    }))
  }
}
```

### Example: Reaction Duplication
```typescript
if (originalWebinar.reactions && originalWebinar.reactions.length > 0) {
  webinarData.reactions = {
    create: originalWebinar.reactions.map((reaction: any) => ({
      type: reaction.type,
      videoTimestamp: reaction.videoTimestamp,
      isScripted: reaction.isScripted || false,
      isHidden: reaction.isHidden || false,
      userName: reaction.userName,
      userId: reaction.userId
    }))
  }
}
```

## Use Cases

### Marketing Campaigns
- Duplicate successful webinar for new campaign
- Keep proven chat messages and reactions
- Maintain engagement patterns that worked

### Testing
- Create test version with same setup
- Test new offers while keeping chat/reactions
- A/B test different presentations with same engagement

### Templates
- Use successful webinars as templates
- Replicate high-converting chat sequences
- Maintain proven social proof (reactions)

## Testing the Feature

### Manual Test
1. Go to Dashboard → Webinars
2. Find a webinar with chat messages and reactions
3. Click "Duplicate" button
4. Go to the new duplicated webinar
5. Check Chat tab - all messages should be there
6. Check Reactions - all reactions should be there

### API Test
```bash
curl -X POST http://localhost:3000/api/webinars/[webinar-id]/duplicate \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"
```

### Verification
```sql
-- Check original webinar
SELECT 
  w.id, 
  w.title,
  COUNT(DISTINCT c.id) as chat_count,
  COUNT(DISTINCT r.id) as reaction_count
FROM webinars w
LEFT JOIN chat_messages c ON c.webinarId = w.id
LEFT JOIN reactions r ON r.webinarId = w.id
WHERE w.id = 'original-id'
GROUP BY w.id, w.title;

-- Compare with duplicated webinar
SELECT 
  w.id, 
  w.title,
  COUNT(DISTINCT c.id) as chat_count,
  COUNT(DISTINCT r.id) as reaction_count
FROM webinars w
LEFT JOIN chat_messages c ON c.webinarId = w.id
LEFT JOIN reactions r ON r.webinarId = w.id
WHERE w.title LIKE '%Copy%'
GROUP BY w.id, w.title;
```

## Benefits

✅ **Save Time**: Don't manually recreate engagement elements
✅ **Maintain Quality**: Keep proven chat sequences
✅ **Consistency**: Same user experience across webinar iterations
✅ **Social Proof**: Reactions add credibility to new webinars
✅ **Testing**: Easy to A/B test with consistent engagement baseline

---

**Status**: ✅ Fully Implemented and Working
**Last Updated**: November 12, 2025
