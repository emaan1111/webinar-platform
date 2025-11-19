# Embed Form Tracking - Quick Guide

## What's New?
Inline and popup embed forms now automatically track unique views, just like your registration pages! This lets you calculate conversion rates for embedded forms.

## What Gets Tracked?

### Inline Forms
- ✅ Tracked when form loads on external website
- ✅ Unique visitors counted via browser localStorage
- ✅ Device type (mobile/tablet/desktop)
- ✅ Parent page URL (referrer)

### Popup Forms  
- ✅ Tracked when user clicks to open popup
- ✅ Same tracking as inline forms
- ✅ Separate count from inline

## How to Use

### 1. Embed Your Form
```html
<!-- Inline -->
<div id="webinar-embed-YOUR_ID"></div>
<script src="https://yoursite.com/api/embed/YOUR_ID?theme=registration&type=inline"></script>

<!-- Popup -->
<button data-webinar-popup="YOUR_ID">Register</button>
<script src="https://yoursite.com/api/embed/YOUR_ID?theme=purple&type=popup"></script>
```

### 2. View Analytics
1. Go to **Dashboard → Analytics**
2. Select your webinar
3. Scroll to **"Embed Form Performance"** card
4. See metrics:
   - Total embed views
   - Inline vs popup breakdown
   - Unique visitors
   - Conversion rate

## Analytics Displayed

### Embed Form Performance Card
```
┌─────────────────────────────────────────────┐
│  Total Embed Views                          │
│  234                                        │
│  187 unique visitors                        │
├─────────────────────────────────────────────┤
│  Inline Forms    │  Popup Forms            │
│  156             │  78                     │
│  124 unique      │  63 unique              │
├─────────────────────────────────────────────┤
│  Embed Conversion Rate                      │
│  12.8%                                      │
│  24 registrations from 187 unique visitors  │
└─────────────────────────────────────────────┘
```

## Key Metrics

**Total Embed Views**: How many times your embeds were seen/opened  
**Unique Visitors**: Number of different people (deduplicated)  
**Inline Forms**: Views of inline embedded forms  
**Popup Forms**: Times popup was opened  
**Conversion Rate**: % of embed visitors who registered

## Benefits

✅ **Measure ROI** - Know if your embeds are working  
✅ **Compare Channels** - Embeds vs direct registration page  
✅ **Track Performance** - See which placements work best  
✅ **Identify Issues** - High views but low conversions? Something's wrong  
✅ **Optimize** - Test different themes and measure results

## Privacy-Friendly

- No cookies used (only localStorage)
- No personal data collected
- Random visitor IDs
- GDPR compliant

## Technical Details

### Database
- Uses existing `PageVisit` table
- `pageType: 'embed-inline'` or `'embed-popup'`
- Same structure as registration page tracking

### Visitor Identification
```javascript
// Automatic - same ID across all pages
visitorId = localStorage.getItem('visitorId') || crypto.randomUUID()
```

### API Endpoints
Both analytics endpoints now include embed data:
- `GET /api/analytics/aggregate` - Multiple webinars
- `GET /api/webinars/[id]/analytics` - Single webinar

## Example Use Cases

### Use Case 1: Partner Website
You embed your form on partner sites. Now you can:
- See how many views each partner drives
- Calculate conversion rate per partner
- Optimize your best-performing embeds

### Use Case 2: Marketing Campaigns
Run campaigns with embedded forms on landing pages:
- Track views per campaign
- Measure conversion rates
- Compare to main registration page

### Use Case 3: A/B Testing
Test different embed themes:
- Try `theme=registration` vs `theme=purple`
- Track which converts better
- Optimize for maximum registrations

## What's NOT Tracked (Yet)

These could be future enhancements:
- ❌ Which specific domain/URL had the embed
- ❌ Which registrations came specifically from embeds
- ❌ Form field interactions (starts, abandons)
- ❌ Geographic location of embed viewers

## Quick Test

Want to verify it's working?

1. **Create test HTML file**:
```html
<div id="webinar-embed-abc123"></div>
<script src="http://localhost:3000/api/embed/abc123?theme=registration&type=inline"></script>
```

2. **Open in browser** (use incognito for unique visitor)

3. **Check analytics** - Should see embed views appear!

## Questions?

- **Q: Do inline and popup track separately?**  
  A: Yes! You'll see breakdown of each type.

- **Q: What if user visits multiple times?**  
  A: Total views increases, but unique visitors stays the same (per browser).

- **Q: Can I track which registrations came from embeds?**  
  A: Not yet - currently tracks all registrations. This could be added by including a `source` field.

- **Q: Does this work with existing embeds?**  
  A: Yes! All embeds now automatically track views.

---

**You're all set!** Embed tracking is now live and working automatically for all your webinar embed forms. 🎉
