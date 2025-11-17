# Replay Countdown Banner - Quick Guide ✅

## ✨ Feature Overview
When a webinar broadcast ends and transitions to replay mode, a **big red countdown banner** appears at the top of the page showing how much time remains before the replay expires.

## 🎨 Banner Design
- **Fixed position** at top of page
- **Red gradient background** (#dc2626 → #ef4444)
- **Pulsing animation** for urgency
- **Clock icon** ⏰ on left
- **Warning icon** ⚠️ on right
- **Smart countdown formatting**:
  - More than 1 day: "5d 3h 12m"
  - Less than 1 day: "18h 45m 30s"
  - Less than 1 hour: "45m 23s"
  - Less than 1 minute: "38s"

## 🚀 How to Enable

### Option 1: Set Replay Duration (Personalized)
1. Go to **Dashboard → Webinars → [Your Webinar] → Edit**
2. Scroll to **"🎬 Replay Settings"** section
3. Check **"Enable Replay Access"**
4. Set **"Replay Availability Period"** (e.g., 7 days)
5. Click **"Update Webinar"**

**How it works:**
- Each attendee's replay expires X days after **their scheduled session time**
- Example: Set to 7 days
  - Attendee A registered for 3:00 PM on Jan 1 → Replay expires Jan 8 at 3:00 PM
  - Attendee B registered for 5:00 PM on Jan 2 → Replay expires Jan 9 at 5:00 PM

### Option 2: Set Absolute Expiration (Same for Everyone)
1. Go to **Dashboard → Webinars → [Your Webinar] → Edit**
2. Scroll to **"🎬 Replay Settings"** section  
3. Check **"Enable Replay Access"**
4. Set **"Absolute Expiration Date"** (e.g., Jan 15, 2025 at 11:59 PM)
5. Click **"Update Webinar"**

**How it works:**
- ALL attendees see replay expire at the same time
- Overrides the duration setting
- Useful for time-sensitive promotions or offers

## 📍 When Banner Appears
The banner shows automatically when:
1. ✅ Webinar broadcast has ended (elapsed time > webinar duration)
2. ✅ Replay is enabled (`replayEnabled = true`)
3. ✅ Expiration date is set (`replayExpiresAt` exists)
4. ✅ Expiration hasn't passed yet (countdown > 0)

## 🔍 How It Works Technically

### Server Side (`/src/app/room/[slug]/page.tsx`)
```typescript
// Line 416: Pass replayExpiresAt to client
replayExpiresAt: webinar.replayExpiresAt?.toISOString() || null,
```

### Client Side (`/src/app/w/[slug]/live/page-client.tsx`)
```typescript
// Line 1362: Detect replay mode
const isReplay = isReplayMode || (totalDuration != null ? elapsedSeconds >= totalDuration : false);

// Lines 1633-1668: Countdown timer updates every second
useEffect(() => {
  if (!isReplay || !webinar.replayExpiresAt) {
    setReplayTimeRemaining(null);
    return;
  }

  const updateCountdown = () => {
    const now = Date.now();
    const expiresAt = new Date(webinar.replayExpiresAt!).getTime();
    const diff = expiresAt - now;

    if (diff <= 0) {
      setReplayTimeRemaining('EXPIRED');
      return;
    }

    // Calculate days, hours, minutes, seconds
    // Format based on time remaining
  };

  updateCountdown();
  const interval = setInterval(updateCountdown, 1000);
  return () => clearInterval(interval);
}, [isReplay, webinar.replayExpiresAt]);

// Lines 1685-1697: Banner JSX
{isReplay && replayTimeRemaining && replayTimeRemaining !== 'EXPIRED' && (
  <div className={styles.replayExpirationBanner}>
    <div className={styles.replayBannerContent}>
      <i className="fas fa-clock" style={{ marginRight: '12px', fontSize: '20px' }} />
      <span className={styles.replayBannerText}>
        <strong>Replay Expires In:</strong> {replayTimeRemaining}
      </span>
      <i className="fas fa-exclamation-triangle" style={{ marginLeft: '12px', fontSize: '18px' }} />
    </div>
  </div>
)}
```

### CSS (`/src/app/w/[slug]/live/WebinarLivePage.module.css`)
```css
/* Lines 1947-2020: Banner styles */
.replayExpirationBanner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
  color: white;
  padding: 16px 24px;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
  animation: slideDown 0.5s ease-out, pulse 2s ease-in-out infinite;
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
  }
  50% {
    box-shadow: 0 4px 20px rgba(220, 38, 38, 0.5), 0 0 0 4px rgba(220, 38, 38, 0.2);
  }
}
```

## ✅ Testing Steps

1. **Set expiration date:**
   - Go to webinar edit page
   - Set "Absolute Expiration Date" to 5 minutes from now
   - Save

2. **Wait for webinar to end:**
   - Go to the live room page
   - Wait until webinar duration passes (or set duration to 1 minute for quick testing)

3. **Verify banner appears:**
   - Page should automatically transition to replay mode
   - Red banner should appear at top
   - Countdown should update every second
   - Icons should be visible
   - Time format should change as countdown decreases

4. **Test expiration:**
   - Wait for countdown to reach 0
   - Banner should disappear (showing "EXPIRED" briefly)

## 🐛 Troubleshooting

### Banner doesn't show:
1. ✅ Check webinar has ended (elapsed time > duration)
2. ✅ Check replay is enabled in admin panel
3. ✅ Check `replayExpiresAt` is set (not null)
4. ✅ Check expiration is in the future (not already expired)
5. ✅ Open browser console and look for: `🎬 Webinar ended, showing replay on same page`

### Countdown not updating:
1. ✅ Check browser console for errors
2. ✅ Verify Font Awesome icons are loaded (clock & warning icons)
3. ✅ Clear browser cache and refresh

### Styling issues:
1. ✅ Verify CSS file was saved correctly
2. ✅ Clear Next.js cache: `rm -rf .next`
3. ✅ Restart dev server: `npm run dev`

## 📱 Mobile Responsive
Banner adapts to mobile screens:
- Smaller padding (12px vs 16px)
- Smaller font (14px vs 18px)
- Smaller icons (16px vs 20px)
- Maintains readability and urgency

## 🎯 Use Cases
1. **Limited-time replay** - Create urgency for viewers to watch
2. **Evergreen campaigns** - Set expiration per attendee's schedule
3. **Promotional deadlines** - Absolute expiration for special offers
4. **Automated cleanup** - Expire old replays automatically

---

## 🎉 Status: COMPLETE ✅

All features implemented and tested:
- ✅ Database schema updated
- ✅ Admin UI for settings
- ✅ Server-side expiration logic
- ✅ Client-side countdown timer
- ✅ Banner JSX and styling
- ✅ Mobile responsive design
- ✅ Pulsing animation for urgency
- ✅ Smart time formatting

The banner will automatically show when a broadcast ends and transitions to replay mode, as long as a `replayExpiresAt` date is set! 🚀
