# Template Management Updates - November 13, 2025

## 🎉 New Features Added

### 1. **Larger Preview Windows** (95% viewport)
- Preview modals now use **95vw × 95vh** (95% of viewport width and height)
- Much bigger viewing area for better template visualization
- Minimum height of 85vh for iframe content
- Better inspection of template details

**Before:** max-w-6xl (1152px max width), max-h-[90vh]
**After:** w-[95vw] h-[95vh] (scales to screen size)

### 2. **Visual Editor Mode** 🎨
Added a dual-mode editor with tabs:

#### **Code Editor Mode** (💻)
- Traditional HTML/CSS/JavaScript textarea editor
- Syntax-friendly monospace font
- Variable reference guide
- Direct code editing
- 20+ rows for comfortable coding

#### **Visual Editor Mode** (🎨)
- **Live preview** of your template in a 600px tall iframe
- **Interactive inspection** - right-click any element to use browser DevTools
- **Real-time visualization** as you switch between modes
- **Perfect for planning** - see changes visually before committing
- **Instructions included** on how to use DevTools for editing

**How It Works:**
1. Write your HTML in Code Editor
2. Switch to Visual Editor to see live preview
3. Right-click elements to inspect with DevTools
4. Use DevTools to experiment with changes
5. Copy modified HTML back to Code Editor
6. Save your template

### 3. **Apple Calendar Support** 🍎
Added comprehensive calendar support for multiple platforms:

#### **New Variables:**
- `{{googleCalendarLink}}` - Google Calendar (same as `{{calendarLink}}`)
- `{{appleCalendarLink}}` - Apple Calendar (.ics format)
- `{{icsCalendarLink}}` - Generic ICS format (works with Outlook, etc.)

#### **What Works:**
- ✅ **Apple Calendar** (macOS/iOS)
- ✅ **Google Calendar** (web/mobile)
- ✅ **Microsoft Outlook** (desktop/web)
- ✅ **Yahoo Calendar**
- ✅ **Any calendar supporting ICS format**

#### **Implementation:**
The `.ics` file is generated as a data URL with:
- Event title (webinar name)
- Event description
- Start and end times
- Location (Online Webinar)
- Unique identifier
- Proper VCALENDAR format

**Usage Example:**
```html
<div class="calendar-buttons">
    <a href="{{googleCalendarLink}}" class="btn btn-google">
        📅 Add to Google Calendar
    </a>
    <a href="{{appleCalendarLink}}" class="btn btn-apple" download="webinar.ics">
        🍎 Add to Apple Calendar
    </a>
</div>
```

---

## 📝 Updated Files

### `/src/app/dashboard/templates/thank-you/page.tsx`
- ✅ Preview modal size: 95vw × 95vh
- ✅ Added `editorMode` state ('code' | 'visual')
- ✅ Added tab switcher in modal header
- ✅ Added visual editor iframe (600px tall)
- ✅ Added instructions for visual editing
- ✅ Updated variable list with new calendar options
- ✅ Added calendar link explanation

### `/src/app/dashboard/templates/countdown/page.tsx`
- ✅ Preview modal size: 95vw × 95vh
- ✅ Added `editorMode` state ('code' | 'visual')
- ✅ Added tab switcher in modal header
- ✅ Added visual editor iframe (600px tall)
- ✅ Added instructions for visual editing

### `/src/app/thank-you/[slug]/page.tsx`
- ✅ Added `googleCalendarLink` variable (alias of calendarLink)
- ✅ Added `appleCalendarLink` variable (.ics data URL)
- ✅ Added `icsCalendarLink` variable (same as apple)
- ✅ Generates proper VCALENDAR/VEVENT format
- ✅ Includes all event details (title, description, location, times)

---

## 🎨 Visual Editor Features

### What You Can Do:
1. **View Live Preview** - See your template rendered in real-time
2. **Inspect Elements** - Right-click → Inspect to open DevTools
3. **Edit Text** - Double-click text in DevTools Elements panel
4. **Change Styles** - Modify CSS in DevTools Styles panel
5. **Delete Elements** - Select element, press Delete key in DevTools
6. **Add Elements** - Use DevTools Console or edit HTML directly
7. **Experiment Safely** - Changes in DevTools don't save automatically

### Workflow:
```
1. Code Editor: Write initial HTML
         ↓
2. Visual Editor: Preview and plan changes
         ↓
3. DevTools: Experiment with modifications
         ↓
4. Code Editor: Copy final HTML from DevTools
         ↓
5. Save Template
```

### Tips:
- 💡 Use Visual Editor to **visualize** while Code Editor is for **structure**
- 💡 DevTools changes are **temporary** - copy HTML to save them
- 💡 Switch between modes freely - your code is preserved
- 💡 Visual mode is perfect for **designing layouts** and **testing styles**

---

## 📅 Calendar Integration Examples

### Simple Buttons (Both Calendars)
```html
<div style="display: flex; gap: 10px; justify-content: center; margin: 20px 0;">
    <a href="{{googleCalendarLink}}" 
       style="padding: 12px 24px; background: #4285F4; color: white; text-decoration: none; border-radius: 6px;">
        📅 Google Calendar
    </a>
    <a href="{{appleCalendarLink}}" 
       download="{{webinarTitle}}.ics"
       style="padding: 12px 24px; background: #000; color: white; text-decoration: none; border-radius: 6px;">
        🍎 Apple Calendar
    </a>
</div>
```

### Dropdown Style
```html
<div class="calendar-dropdown">
    <button class="calendar-btn">📅 Add to Calendar ▼</button>
    <div class="dropdown-menu">
        <a href="{{googleCalendarLink}}" target="_blank">Google Calendar</a>
        <a href="{{appleCalendarLink}}" download="webinar.ics">Apple Calendar</a>
        <a href="{{icsCalendarLink}}" download="webinar.ics">Outlook/Other</a>
    </div>
</div>
```

### Icon Buttons
```html
<div class="calendar-icons">
    <a href="{{googleCalendarLink}}" title="Add to Google Calendar">
        <img src="google-calendar-icon.svg" alt="Google" width="40" />
    </a>
    <a href="{{appleCalendarLink}}" download="event.ics" title="Add to Apple Calendar">
        <img src="apple-calendar-icon.svg" alt="Apple" width="40" />
    </a>
</div>
```

---

## 🚀 How to Use New Features

### Using Visual Editor:
1. Go to `/dashboard/templates/thank-you` or `/countdown`
2. Click "✏️ Edit" on any template
3. Click "🎨 Visual Editor" tab
4. See your template rendered live
5. Right-click any element and select "Inspect"
6. Use browser DevTools to:
   - Edit text content
   - Modify CSS styles
   - Delete unwanted elements
   - Test different layouts
7. When happy, copy the modified HTML from DevTools
8. Switch to "💻 Code Editor" tab
9. Paste the new HTML
10. Click "Update Template"

### Adding Apple Calendar Support:
1. Edit your thank you page template
2. Find your existing calendar button/link
3. Add a new button for Apple Calendar:
   ```html
   <a href="{{appleCalendarLink}}" download="webinar.ics">
       🍎 Add to Apple Calendar
   </a>
   ```
4. Style it to match your design
5. Save template
6. Test on a live thank you page

---

## 📊 Feature Comparison

| Feature | Before | After |
|---------|--------|-------|
| **Preview Size** | 1152px max width | 95% of viewport (scales) |
| **Editor Modes** | Code only | Code + Visual |
| **Live Preview** | Separate modal | Integrated in editor |
| **Calendar Support** | Google only | Google + Apple + ICS |
| **Visual Editing** | None | DevTools integration |
| **Preview Height** | 90vh max | 95vh (full screen) |

---

## 🔧 Technical Details

### ICS Calendar Format:
```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Webinar Platform//EN
BEGIN:VEVENT
DTSTART:20251113T140000Z
DTEND:20251113T150000Z
SUMMARY:Advanced React Patterns
DESCRIPTION:Learn advanced React patterns...
LOCATION:Online Webinar
UID:registration-id@webinar-platform.com
END:VEVENT
END:VCALENDAR
```

### Data URL Format:
```
data:text/calendar;charset=utf-8,BEGIN%3AVCALENDAR...
```

### Modal Sizes:
- **Old:** `max-w-6xl w-full max-h-[90vh]`
- **New:** `w-[95vw] h-[95vh]`
- **Iframe:** `min-h-[85vh]`

---

## 💡 Best Practices

### Visual Editor:
✅ Use for quick layout checks
✅ Use DevTools to experiment before committing
✅ Copy final HTML from DevTools → Code Editor
✅ Switch between modes to verify changes
❌ Don't rely solely on visual mode for complex edits
❌ Don't forget to copy changes back to code editor

### Calendar Links:
✅ Offer both Google and Apple options
✅ Use descriptive button text
✅ Add `download` attribute to ICS links
✅ Style buttons distinctly for each platform
✅ Test on actual devices (iOS, macOS, Windows)

### Templates:
✅ Use responsive design (viewport meta tag)
✅ Test in preview before publishing
✅ Keep HTML self-contained (embedded CSS/JS)
✅ Use semantic HTML elements
✅ Provide fallback content for variables

---

## 🐛 Known Limitations

### Visual Editor:
- Changes in DevTools are **not automatically saved**
- Must manually copy HTML back to Code Editor
- Complex JavaScript may not work in preview iframe
- Some external resources may not load

### Calendar Links:
- ICS downloads work best on desktop browsers
- Mobile browsers may have different behaviors
- Some email clients have ICS support limitations
- Test across different devices and platforms

---

## 📱 Cross-Platform Testing

### Desktop:
- ✅ Chrome/Edge: Full support
- ✅ Safari: Full support  
- ✅ Firefox: Full support

### Mobile:
- ✅ iOS Safari: Apple Calendar opens automatically
- ✅ Android Chrome: Downloads ICS, opens with default calendar
- ✅ Mobile apps: May have varying ICS support

### Email Clients:
- ✅ Apple Mail: Direct ICS support
- ✅ Outlook: ICS attachment opens automatically
- ⚠️ Gmail: May show as attachment to download

---

## 🎯 Quick Reference

### All Calendar Variables:
```
{{calendarLink}}        → Google Calendar (original)
{{googleCalendarLink}}  → Google Calendar (explicit)
{{appleCalendarLink}}   → Apple Calendar (.ics)
{{icsCalendarLink}}     → Generic ICS format
```

### Editor Modes:
```
💻 Code Editor    → Direct HTML/CSS/JS editing
🎨 Visual Editor  → Live preview with DevTools
```

### Preview Sizes:
```
Main Preview Modal:  95vw × 95vh (full screen)
Editor Preview:      100% × 600px (in modal)
Template Cards:      Grid layout (responsive)
```

---

**Status:** ✅ **ALL FEATURES LIVE**

Test the new features at:
- `/dashboard/templates/thank-you`
- `/dashboard/templates/countdown`

Enjoy the enhanced template management experience! 🚀
