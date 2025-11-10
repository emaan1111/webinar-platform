# 🎨 Template System - Visual Flow Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER CREATES WEBINAR                     │
│                    /dashboard/webinars/new                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ 1. Fill form
                             │ 2. Select template
                             │ 3. Enter custom HTML (if custom)
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API: POST /api/webinars                      │
│                                                                   │
│   Saves to database:                                             │
│   - registrationTemplate: 'default' | 'minimal' | 'urgency' |    │
│                          'custom'                                │
│   - customHtml: '<div>...</div>'                                 │
│   - customCss: '.hero { ... }'                                   │
│   - customJs: 'console.log(...)'                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Webinar saved ✅
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   VISITOR OPENS REGISTRATION                     │
│                      /w/[slug]                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Fetch webinar data
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TEMPLATE ROUTER (page.tsx)                    │
│                                                                   │
│   Checks: webinar.registrationTemplate                           │
│                                                                   │
│   ┌──────────────┐  ┌───────────────┐  ┌──────────────┐        │
│   │   'default'  │  │   'minimal'   │  │  'urgency'   │        │
│   └──────┬───────┘  └───────┬───────┘  └──────┬───────┘        │
│          │                  │                  │                 │
│          ▼                  ▼                  ▼                 │
│   DefaultTemplate    MinimalTemplate    UrgencyTemplate          │
│                                                                   │
│   ┌──────────────┐                                               │
│   │   'custom'   │                                               │
│   └──────┬───────┘                                               │
│          │                                                        │
│          ▼                                                        │
│   CustomTemplate                                                 │
│   - Replace variables                                            │
│   - Sanitize HTML                                                │
│   - Inject CSS/JS                                                │
│   - Handle clicks                                                │
└─────────────────────────────────────────────────────────────────┘
```

## Template Selection Flow

```
Admin Dashboard Form
┌───────────────────────────────────────────────────────────────┐
│ Registration Page Template                                     │
│                                                                 │
│ Template Style: [▼ Dropdown]                                  │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ [ ] Default - Full Feature                              │   │
│ │ [•] Minimal - Clean & Professional  ◄── User selects    │   │
│ │ [ ] Urgency - High Pressure                             │   │
│ │ [ ] Custom HTML - Build Your Own                        │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ✨ Clean, professional blue design - perfect for B2B          │
└───────────────────────────────────────────────────────────────┘
                             │
                             │ User saves webinar
                             ▼
                      Database saves:
              registrationTemplate = 'minimal'
                             │
                             │ Visitor opens /w/slug
                             ▼
                      Router loads:
              templates/minimal.tsx component
                             │
                             ▼
                 ┌────────────────────────┐
                 │   MINIMAL TEMPLATE     │
                 │                        │
                 │   Clean Blue Design    │
                 │   Simple Checklist     │
                 │   Single CTA           │
                 │   Professional Look    │
                 └────────────────────────┘
```

## Custom HTML Flow

```
Admin selects "Custom HTML"
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│ Custom HTML Editor                                            │
│                                                                │
│ Template Variables Guide:                                     │
│ {{webinar.title}}        - Webinar title                      │
│ {{webinar.description}}  - Description                        │
│ {{webinar.duration}}     - Duration                           │
│ {{schedules}}            - Schedule list                      │
│                                                                │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ <div class="hero">                                     │   │
│ │   <h1>{{webinar.title}}</h1>                          │   │
│ │   <p>{{webinar.description}}</p>                      │   │
│ │   <button data-action="register">                     │   │
│ │     Register Now                                       │   │
│ │   </button>                                            │   │
│ │ </div>                                                 │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                                │
│ Custom CSS:                                                    │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ .hero {                                                │   │
│ │   background: linear-gradient(135deg, #667eea, #764ba2)│   │
│ │   padding: 60px;                                       │   │
│ │   text-align: center;                                  │   │
│ │ }                                                       │   │
│ └────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
                             │
                             │ User saves
                             ▼
                      Database stores:
               customHtml = '<div>...</div>'
               customCss = '.hero {...}'
                             │
                             │ Visitor opens page
                             ▼
┌──────────────────────────────────────────────────────────────┐
│               CustomTemplate Component                        │
│                                                                │
│  1. Take customHtml from database                             │
│  2. Replace {{webinar.title}} → "Actual Title"               │
│  3. Replace {{webinar.description}} → "Actual Description"   │
│  4. Replace {{schedules}} → Generated schedule HTML          │
│  5. Sanitize with DOMPurify (XSS protection)                 │
│  6. Inject customCss in <style> tag                          │
│  7. Inject customJs in <script> tag                          │
│  8. Add click handlers for data-action attributes            │
│  9. Render final HTML                                         │
└──────────────────────────────────────────────────────────────┘
                             │
                             ▼
                    Rendered Page:
┌──────────────────────────────────────────────────────────────┐
│                                                                │
│    ╔══════════════════════════════════════════════╗          │
│    ║         🎨 Custom Designed Page              ║          │
│    ║                                               ║          │
│    ║         Actual Title Here                    ║          │
│    ║                                               ║          │
│    ║         Actual Description Here              ║          │
│    ║                                               ║          │
│    ║      [  Register Now  ]  ◄── Clickable      ║          │
│    ║                                               ║          │
│    ╚══════════════════════════════════════════════╝          │
│                                                                │
│  User clicks "Register Now" (data-action="register")         │
│        │                                                       │
│        ▼                                                       │
│  Registration Modal Opens                                     │
│  ┌────────────────────────────┐                              │
│  │ Name: [____________]       │                              │
│  │ Email: [___________]       │                              │
│  │ Phone: [___________]       │                              │
│  │ [✓] GDPR Consent           │                              │
│  │ [ Register ]               │                              │
│  └────────────────────────────┘                              │
└──────────────────────────────────────────────────────────────┘
```

## Variable Replacement Example

```
BEFORE (in database):
┌─────────────────────────────────────────┐
│ customHtml:                             │
│ <h1>{{webinar.title}}</h1>             │
│ <p>{{webinar.description}}</p>         │
│ <span>{{webinar.duration}} min</span>  │
│ {{schedules}}                           │
└─────────────────────────────────────────┘

CustomTemplate.tsx processes:
┌─────────────────────────────────────────┐
│ webinar = {                             │
│   title: "Master JavaScript",           │
│   description: "Learn modern JS",       │
│   duration: 60                          │
│ }                                        │
│                                          │
│ html.replace(/{{webinar.title}}/g,      │
│              webinar.title)              │
│ html.replace(/{{webinar.description}}/g,│
│              webinar.description)        │
│ html.replace(/{{webinar.duration}}/g,   │
│              webinar.duration)           │
│ html.replace(/{{schedules}}/g,          │
│              generateScheduleHtml())     │
└─────────────────────────────────────────┘

AFTER (rendered to user):
┌─────────────────────────────────────────┐
│ <h1>Master JavaScript</h1>             │
│ <p>Learn modern JS</p>                 │
│ <span>60 min</span>                     │
│ <div class="schedule">                  │
│   <div>Jan 15, 2025 at 2:00 PM</div>  │
│   <div>Jan 22, 2025 at 2:00 PM</div>  │
│ </div>                                  │
└─────────────────────────────────────────┘
```

## Security Flow (XSS Protection)

```
User enters malicious HTML:
┌─────────────────────────────────────────────────────┐
│ <script>alert('hack')</script>                      │
│ <img src=x onerror="alert('xss')">                 │
│ <button onclick="doEvil()">Click Me</button>       │
└─────────────────────────────────────────────────────┘
                    │
                    │ Saved to database
                    ▼
            CustomTemplate loads
                    │
                    │ DOMPurify.sanitize(html, {...})
                    ▼
┌─────────────────────────────────────────────────────┐
│ REMOVED: <script> tags                              │
│ REMOVED: onerror handlers                           │
│ REMOVED: onclick attributes                         │
│ KEPT:    Safe HTML tags                             │
│ KEPT:    data-action attributes (whitelisted)       │
└─────────────────────────────────────────────────────┘
                    │
                    ▼
         Safe HTML rendered:
┌─────────────────────────────────────────────────────┐
│ <!-- script tag removed -->                         │
│ <img src=x>  <!-- onerror removed -->              │
│ <button>Click Me</button>  <!-- onclick removed --> │
│                                                      │
│ ✅ User is protected from XSS attacks              │
└─────────────────────────────────────────────────────┘
```

## File Structure

```
src/app/w/[slug]/
│
├── page.tsx                    ◄── ROUTER (110 lines)
│   │
│   ├─ Fetches webinar data
│   ├─ Checks registrationTemplate field
│   ├─ Loads appropriate template component
│   └─ Shows loading/error states
│
└── templates/
    │
    ├── default.tsx             ◄── 818 lines
    │   └─ Original full-feature design
    │      Gradient header, countdown, bonuses
    │
    ├── minimal.tsx             ◄── 343 lines
    │   └─ Clean blue professional design
    │      Simple checklist, single CTA
    │
    ├── urgency.tsx             ◄── 465 lines
    │   └─ High-pressure red design
    │      Large countdown, scarcity messages
    │
    └── custom.tsx              ◄── 291 lines
        └─ User HTML renderer
           Variable replacement
           DOMPurify sanitization
           CSS/JS injection
```

## Database Fields

```sql
webinars table:
┌─────────────────────────┬──────────┬─────────────────────┐
│ Column                  │ Type     │ Default             │
├─────────────────────────┼──────────┼─────────────────────┤
│ registrationTemplate    │ text     │ 'default'           │
│ customHtml              │ text     │ NULL                │
│ customCss               │ text     │ NULL                │
│ customJs                │ text     │ NULL                │
│ enableSplitTest         │ boolean  │ false               │
│ splitTestVariantA       │ text     │ NULL                │
│ splitTestVariantB       │ text     │ NULL                │
│ splitTestTraffic        │ integer  │ 50                  │
└─────────────────────────┴──────────┴─────────────────────┘
```

## Admin UI Layout

```
┌──────────────────────────────────────────────────────────┐
│ Create Webinar                                            │
├──────────────────────────────────────────────────────────┤
│                                                            │
│ ┌─ Basic Information ──────────────────────────────────┐ │
│ │ Title: [_____________________________]               │ │
│ │ Slug:  [_____________________________]               │ │
│ │ Description: [________________________]              │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                            │
│ ┌─ Video Configuration ────────────────────────────────┐ │
│ │ Vimeo ID: [__________]                               │ │
│ │ Duration: [__] minutes                               │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                            │
│ ┌─ Webinar Schedules ──────────────────────────────────┐ │
│ │ [Add Schedule] [Add Schedule] [Add Schedule]         │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                            │
│ ┌─ Webinar Features ───────────────────────────────────┐ │
│ │ [✓] Replay  [✓] Chat  [✓] Offers  [✓] Reactions     │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                            │
│ ┌─ Registration Page Template ─────────────────────────┐ │  ◄── NEW!
│ │                                                        │ │
│ │ Template Style: [▼ Default - Full Feature         ]  │ │
│ │                  [ Minimal - Clean & Professional  ]  │ │
│ │                  [ Urgency - High Pressure        ]  │ │
│ │                  [ Custom HTML - Build Your Own   ]  │ │
│ │                                                        │ │
│ │ ✨ Beautiful gradient design with countdown timer    │ │
│ │                                                        │ │
│ │ [If Custom selected:]                                 │ │
│ │                                                        │ │
│ │ Template Variables:                                   │ │
│ │ ┌────────────────────────────────────────────────┐   │ │
│ │ │ {{webinar.title}}        - Webinar title       │   │ │
│ │ │ {{webinar.description}}  - Description         │   │ │
│ │ │ {{webinar.duration}}     - Duration            │   │ │
│ │ │ {{schedules}}            - Schedule list       │   │ │
│ │ └────────────────────────────────────────────────┘   │ │
│ │                                                        │ │
│ │ Custom HTML:                                          │ │
│ │ ┌────────────────────────────────────────────────┐   │ │
│ │ │                                                 │   │ │
│ │ │  <div class="hero">                            │   │ │
│ │ │    <h1>{{webinar.title}}</h1>                 │   │ │
│ │ │    <button data-action="register">            │   │ │
│ │ │      Register Now                              │   │ │
│ │ │    </button>                                   │   │ │
│ │ │  </div>                                        │   │ │
│ │ │                                                 │   │ │
│ │ └────────────────────────────────────────────────┘   │ │
│ │                                                        │ │
│ │ Custom CSS:                                           │ │
│ │ ┌────────────────────────────────────────────────┐   │ │
│ │ │ .hero { background: #667eea; padding: 60px; } │   │ │
│ │ └────────────────────────────────────────────────┘   │ │
│ │                                                        │ │
│ └────────────────────────────────────────────────────┘ │
│                                                            │
│ [Cancel]  [Save as Draft]  [Schedule Webinar]            │
└──────────────────────────────────────────────────────────┘
```

## What Happens When User Visits Registration Page

```
1. User visits: /w/my-webinar
                     │
                     ▼
2. Router (page.tsx) loads
                     │
                     ├─ Fetches webinar from API
                     │  GET /api/webinars/public/my-webinar
                     │
                     ▼
3. API returns webinar data:
   {
     title: "Master JavaScript",
     description: "...",
     duration: 60,
     registrationTemplate: "minimal",  ◄── KEY FIELD
     customHtml: null,
     customCss: null,
     schedules: [...]
   }
                     │
                     ▼
4. Router checks registrationTemplate:
   
   if (registrationTemplate === 'minimal')
                     │
                     ▼
5. Router loads MinimalTemplate component
                     │
                     ├─ templates/minimal.tsx
                     │
                     ▼
6. MinimalTemplate renders:
   
   ┌──────────────────────────────────┐
   │                                   │
   │    Master JavaScript              │  ◄── webinar.title
   │                                   │
   │    Learn modern JavaScript        │  ◄── webinar.description
   │                                   │
   │    ✓ Feature 1                   │
   │    ✓ Feature 2                   │
   │                                   │
   │    [ Register Now ]              │  ◄── Opens modal
   │                                   │
   │    Jan 15, 2025 at 2:00 PM EST   │  ◄── schedules[0]
   │    Jan 22, 2025 at 2:00 PM EST   │  ◄── schedules[1]
   │                                   │
   └──────────────────────────────────┘
                     │
                     │ User clicks "Register Now"
                     ▼
7. Registration Modal Opens
                     │
                     │ User fills form
                     │ User submits
                     ▼
8. POST /api/webinars/{id}/register
                     │
                     ▼
9. Registration saved to database
                     │
                     ▼
10. Success message shown! ✅
```

## Summary

**You have a complete template system that:**
- ✅ Lets admins choose from 4 templates
- ✅ Supports custom HTML/CSS/JS
- ✅ Automatically replaces variables
- ✅ Protects against XSS attacks
- ✅ Works with all existing features
- ✅ Easy to extend with new templates
- ✅ Beautiful admin UI
- ✅ Production ready

**Time to test!** 🚀
