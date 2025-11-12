# ClickFunnels Attendance Tagging - Quick Start

## 🎯 What It Does

Automatically tags contacts in ClickFunnels based on how they interact with your webinar:

- **Registered** → Tag immediately
- **Attended** → Tag when they join
- **Mostly Attended** → Tag if they watched until offer (last 15 mins)
- **Partly Attended** → Tag if they watched 40+ minutes but left early
- **Missed** → Tag if they didn't show up
- **Replay Attended** → Tag if they watched the replay

## ⚡ Quick Setup (5 Minutes)

### Option A: Automatic Setup (Recommended)

Run this script to auto-create tags and get their IDs:

```bash
node scripts/setup-cf-tags.js
```

The script will:
1. Check for existing tags
2. Create missing tags
3. Output the .env configuration for you to copy

### Option B: Manual Setup

### 1. Get Your Tag IDs from ClickFunnels

1. Go to **ClickFunnels** → **Contacts** → **Tags**
2. Create these 6 tags:
   - `UM-Webinar-Registered`
   - `UM-Webinar-Attended`
   - `UM-Webinar-MostlyAttended`
   - `UM-Webinar-PartlyAttended`
   - `UM-Webinar-Missed`
   - `UM-Webinar-ReplayAttended`
3. Click each tag → Copy the **ID from the URL**

### 2. (Optional) Add Tag IDs to `.env`

```bash
CLICKFUNNELS_TAG_REGISTERED="368586"
CLICKFUNNELS_TAG_ATTENDED="368587"
CLICKFUNNELS_TAG_MOSTLY_ATTENDED="368588"
CLICKFUNNELS_TAG_PARTLY_ATTENDED="368589"
CLICKFUNNELS_TAG_MISSED="368590"
CLICKFUNNELS_TAG_REPLAY_ATTENDED="368591"
```
> Skip this step if you want the integration to auto-create tags using the default names above.

### 3. Restart Server

```bash
npm run dev
```

## ✅ That's It!

Tags will now be applied automatically:
- **On registration** → `UM-Webinar-Registered`
- **When they leave** → Other tags based on watch behavior

## 📊 Tag Logic

```
No Show (0 mins)          → UM-Webinar-Missed
Attended (any time)       → UM-Webinar-Attended
Watched 40+ mins          → UM-Webinar-PartlyAttended
Watched until offer       → UM-Webinar-MostlyAttended
Watched replay            → UM-Webinar-ReplayAttended
```

## 🧪 Test It

1. Register for a test webinar
2. Join the webinar room
3. Watch for 2-3 minutes
4. Leave the webinar
5. Check ClickFunnels → Your contact should have tags applied

## 📖 Full Documentation

See `CLICKFUNNELS_ATTENDANCE_TAGGING.md` for:
- Detailed configuration
- Campaign ideas for each tag
- Troubleshooting guide
- API reference

## 🚀 Campaign Ideas

**For "Missed"**: Send replay link + "You missed something amazing"

**For "Partly Attended"**: "You left before the best part..." + highlight offer

**For "Mostly Attended"**: "Special offer reminder" + social proof

**For "Replay"**: "Thanks for watching" + time-limited bonus

---

**Need Help?** Check the console logs - they show exactly what's happening with tags.
