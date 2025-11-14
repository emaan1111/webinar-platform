# ✅ Registration Timing Tags - Quick Reference

## 🎯 What Happens When Someone Registers

```
User Fills Form
     ↓
Registration Created
     ↓
Synced to ClickFunnels
     ↓
⚡ TIMING TAG APPLIED ⚡ (Immediately!)
     ↓
ClickFunnels Automation Triggers
```

## 🏷️ One Tag Per Registration

| When They Register | Tag Applied | Hours Until |
|-------------------|-------------|-------------|
| Monday morning | `24HRREMINDER` | 52 hrs |
| Tuesday evening | `24HRREMINDER` | 27 hrs |
| Wednesday noon | `2HRREMINDER` | 3 hrs |
| Wednesday 12:30 PM | `1HRREMINDER` | 1.5 hrs |
| Wednesday 1:30 PM | `15MINREMINDER` | 30 min |
| Wednesday 2:05 PM | `WESTARTED` | -5 min (late!) |

*Webinar starts Wednesday 2:00 PM*

## 🎨 ClickFunnels Automation Examples

### 24HRREMINDER Flow
```
Tag Applied → Welcome Email → Calendar Invite 
→ Reminder at 24hr → Reminder at 2hr 
→ Reminder at 15min → "We're Live" email
```

### 2HRREMINDER Flow
```
Tag Applied → "Starts Soon" Email 
→ Reminder at 1hr → Reminder at 15min 
→ "We're Live" email
```

### 15MINREMINDER Flow
```
Tag Applied → "Starting Very Soon!" 
→ "We're Live Now!" (at start)
```

### WESTARTED Flow
```
Tag Applied → "We're Live Right Now! Join Here" 
→ Replay offer (1 hour later)
```

## ✅ What's Implemented

- [x] `applyRegistrationTimingTag()` function
- [x] Automatic tagging on registration
- [x] Non-blocking (doesn't slow registration)
- [x] Error handling & logging
- [x] Complete documentation

## 📋 Your Next Steps

1. **Create Tags in ClickFunnels:**
   - 24HRREMINDER
   - 2HRREMINDER
   - 1HRREMINDER
   - 15MINREMINDER
   - WESTARTED

2. **Build Automation Workflows** (one per tag)

3. **Test:** Register for a webinar and check ClickFunnels

## 🔍 Quick Test

```bash
# Register 30 hours before webinar
POST /api/webinars/abc123/register

# Check logs:
⏰ User registered 30.00 hours before webinar
🏷️ Applying registration timing tag: 24HRREMINDER
✅ Registration timing tag "24HRREMINDER" applied successfully

# Check ClickFunnels:
Contact has tag: 24HRREMINDER ✅
Automation started ✅
```

## 💡 Key Points

1. **ONE tag per person** (not multiple tags over time)
2. **Applied immediately** (not at reminder time)
3. **Triggers ClickFunnels automation** (you build the sequences)
4. **Based on registration time** (not webinar time)
5. **Non-blocking** (doesn't slow registration)

## 📄 Full Documentation

See: `REGISTRATION_TIMING_TAGS_FINAL.md`
