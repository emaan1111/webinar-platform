# Reminder Management UI - Visual Guide

## 🎨 UI Components Overview

### Main Navigation Path
```
Dashboard → Webinars → Select Webinar → Click "Reminders" Button
```

### Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Webinar                                              │
│                                                                 │
│  🔔 Email Reminders                        [❌ Cancel / ➕ Add] │
│  How to Help Your Child Love Islam                              │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  ℹ️  How reminders work:                                        │
│  • Reminders are automatically scheduled when someone registers │
│  • Only future reminders are sent (smart scheduling)            │
│  • Use placeholders to personalize emails                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 Create/Edit Form

### Form Structure
```
┌─────────────────────────────────────────────────────────────────┐
│  📧 Create New Reminder                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Send reminder                                                  │
│  ┌──────────────────────────┬──────────────────────────┐       │
│  │ [24 hours before      ▼] │                          │       │
│  └──────────────────────────┴──────────────────────────┘       │
│  💡 This reminder will be sent 24 hours before the webinar      │
│                                                                 │
│  Quick Templates:                                               │
│  ┌────────────┐ ┌──────────────┐ ┌─────────────────┐         │
│  │24 Hours  │ │2 Hours     │ │15 Minutes    │         │
│  │Before    │ │Before      │ │Before        │         │
│  └────────────┘ └──────────────┘ └─────────────────┘         │
│                                                                 │
│  Email Subject                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Tomorrow: {{webinarTitle}}                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  👁️ Show Placeholders                                           │
│                                                                 │
│  Email Body (HTML)                                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ <h2>Hi {{name}}!</h2>                                   │   │
│  │                                                         │   │
│  │ <p>Your webinar <strong>{{webinarTitle}}</strong>      │   │
│  │ starts in 24 hours!</p>                                │   │
│  │                                                         │   │
│  │ <p><strong>Time:</strong> {{webinarTime}}</p>          │   │
│  │                                                         │   │
│  │ <p><a href="{{countdownLink}}" style="...">            │   │
│  │   Go to Countdown Page                                 │   │
│  │ </a></p>                                               │   │
│  │                                                         │   │
│  │ <p>Invite friends:</p>                                 │   │
│  │ <p><a href="{{referralLink}}">{{referralLink}}</a></p> │   │
│  └─────────────────────────────────────────────────────────┘   │
│  💡 You can use HTML tags. Click placeholders to insert.        │
│                                                                 │
│  ☑️ Active (start sending this reminder immediately)            │
│                                                                 │
│  ┌──────────────────┐  ┌────────┐                              │
│  │ 💾 Create Reminder│  │ Cancel │                              │
│  └──────────────────┘  └────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏷️ Placeholder Helper (Expanded)

When you click "Show Placeholders":

```
┌─────────────────────────────────────────────────────────────────┐
│  👁️ Hide Placeholders                                           │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Available Placeholders:                                   │ │
│  │                                                           │ │
│  │ ┌─────────────────────────┬─────────────────────────┐   │ │
│  │ │ {{name}}             📤📋│ {{email}}          📤📋│   │ │
│  │ │ Full name of attendee   │ Attendee email address  │   │ │
│  │ └─────────────────────────┴─────────────────────────┘   │ │
│  │                                                           │ │
│  │ ┌─────────────────────────┬─────────────────────────┐   │ │
│  │ │ {{webinarTitle}}     📤📋│ {{webinarTime}}    📤📋│   │ │
│  │ │ Name of the webinar     │ Formatted time          │   │ │
│  │ └─────────────────────────┴─────────────────────────┘   │ │
│  │                                                           │ │
│  │ ┌─────────────────────────┬─────────────────────────┐   │ │
│  │ │ {{countdownLink}}    📤📋│ {{referralLink}}   📤📋│   │ │
│  │ │ Link to countdown page  │ Unique referral link    │   │ │
│  │ └─────────────────────────┴─────────────────────────┘   │ │
│  │                                                           │ │
│  │ ┌─────────────────────────┐                             │ │
│  │ │ {{webinarTimezone}}  📤📋│                             │ │
│  │ │ User's timezone         │                             │ │
│  │ └─────────────────────────┘                             │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  📤 = Insert into email  📋 = Copy to clipboard                 │
└──────────���──────────────────────────────────────────────────────┘
```

---

## 📋 Reminder List View

### With Multiple Reminders

```
┌─────────────────────────────────────────────────────────────────┐
│  Active Reminders (3 of 3)                                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ⏰ 24 hours before          ✅ Active         👁️ ✏️ 🗑️   │ │
│  │                                                           │ │
│  │ Tomorrow: {{webinarTitle}}                                │ │
│  │                                                           │ │
│  │ ┌─────────────────────────────────────────────────────┐ │ │
│  │ │ Hi John! Your webinar How to Help Your Child Love  │ │ │
│  │ │ Islam starts in 24 hours! Time: Thursday, Nov 14... │ │ │
│  │ └─────────────────────────────────────────────────────┘ │ │
│  │                                                           │ │
│  │ Updated Nov 14, 2025                                      │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ⏰ 2 hours before           ✅ Active         👁️ ✏️ 🗑️   │ │
│  │                                                           │ │
│  │ Starting Soon: {{webinarTitle}}                           │ │
│  │                                                           │ │
│  │ ┌─────────────────────────────────────────────────────┐ │ │
│  │ │ Hi John! Your webinar How to Help Your Child Love  │ │ │
│  │ │ Islam starts in just 2 hours! Time: Thursday...     │ │ │
│  │ └─────────────────────────────────────────────────────┘ │ │
│  │                                                           │ │
│  │ Updated Nov 14, 2025                                      │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ⏰ 15 minutes before        ✅ Active         👁️ ✏️ 🗑️   │ │
│  │                                                           │ │
│  │ Final Reminder: {{webinarTitle}} starts in 15 minutes!   │ │
│  │                                                           │ │
│  │ ┌─────────────────────────────────────────────────────┐ │ │
│  │ │ Hi John! How to Help Your Child Love Islam starts  │ │ │
│  │ │ in 15 minutes! JOIN NOW Don't miss out!             │ │ │
│  │ └─────────────────────────────────────────────────────┘ │ │
│  │                                                           │ │
│  │ Updated Nov 14, 2025                                      │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Inactive Reminder

```
┌───────────────────────────────────────────────────────────────┐
│ ⏰ 1 week before         ⚪ Inactive         👁️ ✏️ 🗑️        │
│                                                               │
│ Save the Date: {{webinarTitle}} in 1 week                     │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Hi {{name}}! Just a friendly reminder that you're...    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ Updated Nov 10, 2025                                          │
└───────────────────────────────────────────────────────────────┘
│                                (Faded/grayed out)             │
```

---

## 🚫 Empty State

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                         🔔                                      │
│                   (Large Bell Icon)                             │
│                                                                 │
│                   No reminders yet                              │
│                                                                 │
│        Create your first reminder to start sending              │
│        automated emails to attendees.                           │
│                                                                 │
│              ┌──────────────────────┐                          │
│              │ ➕ Create First Reminder│                          │
│              └──────────────────────┘                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Button Actions

### Icon Meanings

| Icon | Action | What It Does |
|------|--------|--------------|
| 👁️ | Toggle Active | Switches between active/inactive without editing |
| 👁️‍🗨️ | Toggle Inactive | Same button, different state |
| ✏️ | Edit | Opens form with pre-filled data for editing |
| 🗑️ | Delete | Prompts confirmation, then deletes reminder |
| 📤 | Insert | Inserts placeholder at cursor position in text |
| 📋 | Copy | Copies placeholder to clipboard |

---

## 🎨 Color System

### Status Colors

```
Active Reminder:
┌─────────────────────────────┐
│ ⏰ 24 hours before          │  ← Green badge (bg-green-100)
│ ✅ Active                   │  ← Green text (text-green-600)
└─────────────────────────────┘

Inactive Reminder:
┌─────────────────────────────┐
│ ⏰ 24 hours before          │  ← Gray badge (bg-gray-100)
│ ⚪ Inactive                 │  ← Gray text (text-gray-600)
└─────────────────────────────┘  ← Entire card opacity: 60%
```

### Info/Alert Boxes

```
Info Banner (Blue):
┌─────────────────────────────┐
│ ℹ️  How reminders work:     │  ← Blue background (bg-blue-50)
│ • Bullet point 1            │  ← Blue border (border-blue-200)
│ • Bullet point 2            │  ← Blue text (text-blue-800)
└─────────────────────────────┘

Error Banner (Red):
┌─────────────────────────────┐
│ ⚠️  Error: Failed to save   │  ← Red background (bg-red-50)
│ reminder template           │  ← Red border (border-red-200)
└─────────────────────────────┘  ← Red text (text-red-700)
```

---

## 📱 Responsive Behavior

### Desktop (1024px+)
```
┌─────────────────────────────────────────────────────────────┐
│  Placeholders in 2-column grid                              │
│  ┌───────────────────┬───────────────────┐                 │
│  │ {{name}}       📤📋│ {{email}}      📤📋│                 │
│  ├───────────────────┼───────────────────┤                 │
│  │ {{webinarTitle}}📤📋│ {{webinarTime}}📤📋│                 │
│  └───────────────────┴───────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

### Mobile (< 768px)
```
┌─────────────────────────────┐
│  Placeholders stack          │
│  ┌─────────────────────────┐ │
│  │ {{name}}             📤📋│ │
│  ├─────────────────────────┤ │
│  │ {{email}}            📤📋│ │
│  ├─────────────────────────┤ │
│  │ {{webinarTitle}}     📤📋│ │
│  └─────────────────────────┘ │
└─────────────────────────────┘
```

---

## ⚡ Interactive Elements

### Hover States

```
Button:
Normal:  ┌────────────────┐
         │ Create Reminder│
         └────────────────┘

Hover:   ┌────────────────┐  ← Darker background
         │ Create Reminder│  ← Slight shadow
         └────────────────┘  ← Cursor: pointer

Disabled:┌────────────────┐  ← Grayed out
         │ ⏳ Saving...    │  ← Spinner animation
         └────────────────┘  ← Cursor: not-allowed
```

### Icon Buttons

```
Normal:  [👁️]  ← Gray
Hover:   [👁️]  ← Blue (text-blue-600)
Active:  [👁️]  ← Darker blue

Click:   [⏳]  ← Shows loading spinner temporarily
```

---

## 🎬 User Flow Animations

### Creating a Reminder

```
Step 1: Click "Add Reminder"
        ↓
        Form slides in / expands
        
Step 2: Fill out form
        ↓
        Click "Create Reminder"
        
Step 3: Button shows spinner
        [💾 Saving...]
        
Step 4: Form closes
        ↓
        New reminder appears in list
        
Step 5: Success!
        Reminder card animates in
```

### Deleting a Reminder

```
Step 1: Click 🗑️ icon
        ↓
        Confirmation dialog:
        ┌──────────────────────────┐
        │ Are you sure you want to │
        │ delete this reminder?    │
        │                          │
        │ [Cancel]  [Delete]       │
        └──────────────────────────┘
        
Step 2: Click "Delete"
        ↓
        Reminder card fades out
        
Step 3: Card removed from list
        ↓
        Other cards animate up
```

---

## 💡 Pro Tips Display

### Helpful Text Below Fields

```
Time Selection:
┌──────────────────────────┐
│ [24 hours before      ▼] │
└──────────────────────────┘
💡 This reminder will be sent 24 hours before the webinar starts

Email Body:
┌──────────────────────────────────┐
│ <textarea>                       │
│                                  │
└──────────────────────────────────┘
💡 You can use HTML tags for formatting. Click placeholders above to insert them.
```

---

## 🔍 Example Email Preview

### In the List
```
Subject: Tomorrow: {{webinarTitle}}

Preview:
┌─────────────────────────────────────────────────────────┐
│ Hi John! Your webinar How to Help Your Child Love      │
│ Islam starts in 24 hours! Time: Thursday, November     │
│ 14, 2025 at 7:00 PM EST Go to Countdown Page Invite... │
└─────────────────────────────────────────────────────────┘
                                              (First 200 chars)
```

---

## 📊 Stats Summary (Future Enhancement)

```
┌─────────────────────────────────────────────────────────────────┐
│  Reminder Performance                                           │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │   156    │ │   148    │ │    8     │ │    2     │         │
│  │ Scheduled│ │   Sent   │ │ Pending  │ │  Failed  │         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Quick Reference: Common Tasks

### Task: Create a reminder for 24 hours before
```
1. Click "Add Reminder"
2. Click "24 Hours Before" template button
3. Click "Create Reminder"
Done! ✅
```

### Task: Add personalization to email
```
1. Click "Show Placeholders"
2. Position cursor in email body
3. Click 📤 next to desired placeholder
4. Placeholder inserted at cursor
Done! ✅
```

### Task: Temporarily disable a reminder
```
1. Find reminder in list
2. Click 👁️ icon
3. Status changes to "Inactive"
Done! ✅
```

### Task: Copy placeholder to use elsewhere
```
1. Click "Show Placeholders"
2. Click 📋 next to placeholder
3. Paste anywhere (Ctrl/Cmd + V)
Done! ✅
```

---

## 🎨 Design System

### Typography
```
Page Title:    32px, Bold, Gray-900
Section Title: 20px, Semibold, Gray-900
Card Title:    18px, Semibold, Gray-900
Body Text:     14px, Regular, Gray-700
Helper Text:   12px, Regular, Gray-500
Code/Mono:     13px, Mono, Blue-600
```

### Spacing
```
Page Padding:  2rem (32px)
Card Padding:  1.5rem (24px)
Button Padding: 0.75rem 1.5rem (12px 24px)
Gap Between Cards: 1rem (16px)
Form Field Gap: 1.5rem (24px)
```

### Border Radius
```
Buttons:    6px
Cards:      8px
Badges:     9999px (fully rounded)
Inputs:     6px
```

---

This visual guide should help you understand exactly how the UI looks and behaves! 🎨✨
