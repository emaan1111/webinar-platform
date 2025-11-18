# 🎯 How to Access AI Assistant Settings - Visual Guide

## 📍 Where to Find It

### Step-by-Step Instructions:

---

## Method 1: From Webinars List (NEW! ✨)

### 1. Go to Dashboard → Webinars
```
http://localhost:3000/dashboard/webinars
```

### 2. Find Your Webinar
Look for the webinar you want to configure AI for.

### 3. Click "AI Assistant" Button
You'll see a purple button with a robot icon:

```
┌─────────────────────────────────────────────────────────┐
│  📹 My Webinar                                          │
│  Status: DRAFT | 📅 Nov 18, 2025 | 👥 0/100 | 60 min  │
│                                                         │
│  [👁️ View] [✏️ Edit] [🤖 AI Assistant] [📋 Copy Link] │
│                       ↑↑↑↑↑↑↑↑↑↑↑↑↑                     │
│                    CLICK THIS ONE!                      │
└─────────────────────────────────────────────────────────┘
```

The AI Assistant button will be **purple/highlighted** and easy to spot!

---

## Method 2: Direct URL

### Option A: If you know your webinar ID
```
http://localhost:3000/dashboard/webinars/YOUR_WEBINAR_ID/ai-assistant
```

### Option B: Get the ID from the edit page
1. Go to edit your webinar
2. Look at the URL bar: `/dashboard/webinars/clxxx123xxx/edit`
3. Copy the ID (the part between `/webinars/` and `/edit`)
4. Navigate to: `/dashboard/webinars/YOUR_ID/ai-assistant`

---

## 🎨 What You'll See

Once you click "AI Assistant", you'll see this page:

```
┌──────────────────────────────────────────────────────────┐
│  🤖 AI Chat Assistant              [⚙️ AI Settings]      │
│  Configure AI to answer attendee questions after the CTA │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  🟢 AI Status: Active                              │ │
│  │  Will activate after CTA/offer is shown            │ │
│  │                                    3 Active Docs   │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Program Documents                  [+ Add Document]    │
│  ┌────────────────────────────────────────────────────┐ │
│  │  📘 Program Overview         [v] [✏️] [🗑️]       │ │
│  │  📄 Category: Overview       ✅ Active             │ │
│  ├────────────────────────────────────────────────────┤ │
│  │  💵 Pricing & Plans          [v] [✏️] [🗑️]       │ │
│  │  📄 Category: Pricing        ✅ Active             │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## ⚙️ AI Settings (When to Activate)

### To Configure When AI Activates:

1. Click **"AI Settings"** button (top right of the page)
2. You'll see a modal with these options:

```
┌──────────────────────────────────────────────┐
│  ⚙️ AI Configuration                     [×] │
├──────────────────────────────────────────────┤
│                                              │
│  ┌─────────────────────────────────────┐    │
│  │ ✅ Enable AI Assistant          [ON] │    │
│  │ Allow AI to answer questions         │    │
│  └─────────────────────────────────────┘    │
│                                              │
│  ┌─────────────────────────────────────┐    │
│  │ ✅ Activate After CTA/Offer     [ON] │ ← THIS ONE!
│  │ AI only responds after first offer   │    │
│  └─────────────────────────────────────┘    │
│                                              │
│  Temperature: 0.7                            │
│  [────────●────────────]                    │
│                                              │
│  Max Response Length: 500 tokens             │
│  [────────●────────────]                    │
│                                              │
│              [Cancel]  [💾 Save Config]      │
└──────────────────────────────────────────────┘
```

### The Important Setting:
**"Activate After CTA/Offer"** toggle controls WHEN AI starts responding:
- ✅ **ON** (recommended): AI waits until your CTA/offer appears
- ⏸️ **OFF**: AI responds immediately from the start

---

## 📚 Upload Documents

### To Add Program Documents:

1. On the AI Assistant page, click **"+ Add Document"** button
2. Fill in the form:

```
┌──────────────────────────────────────────────┐
│  Add New Document                        [×] │
├──────────────────────────────────────────────┤
│                                              │
│  Document Title                              │
│  [Program Overview                        ]  │
│                                              │
│  Category                                    │
│  [▼ Program Overview                      ]  │
│     • Program Overview                       │
│     • Pricing & Payment                      │
│     • FAQs                                   │
│     • Curriculum                             │
│     • Testimonials                           │
│                                              │
│  Content (This is what AI learns from)       │
│  ┌─────────────────────────────────────┐    │
│  │ Type your program details here...   │    │
│  │ Be specific and detailed!           │    │
│  │                                     │    │
│  │ Example:                            │    │
│  │ The program includes 8 modules...   │    │
│  │                                     │    │
│  └─────────────────────────────────────┘    │
│                                              │
│  ☑️ Active (AI can use this document)        │
│                                              │
│              [Cancel]  [💾 Create Document]  │
└──────────────────────────────────────────────┘
```

3. Click **"Create Document"**
4. Repeat for at least 3 documents:
   - Program Overview
   - Pricing & Payment Plans
   - FAQs

---

## 🎯 Quick Access Checklist

To access AI settings and upload documents:

✅ **Step 1:** Go to `/dashboard/webinars`  
✅ **Step 2:** Find your webinar in the list  
✅ **Step 3:** Click the purple **"🤖 AI Assistant"** button  
✅ **Step 4:** Click **"AI Settings"** to configure when AI activates  
✅ **Step 5:** Click **"+ Add Document"** to upload knowledge  

---

## 🚀 Visual Navigation Map

```
Dashboard
    │
    ├── Webinars (/dashboard/webinars)
    │       │
    │       ├── [View Webinar List]
    │       │       │
    │       │       └── Each Webinar Card Has:
    │       │           • 👁️ View
    │       │           • ✏️ Edit  
    │       │           • 🤖 AI Assistant ← CLICK HERE!
    │       │           • 📋 Copy Link
    │       │           • 📋 Duplicate
    │       │           • 🗑️ Delete
    │       │
    │       └── AI Assistant Page (/dashboard/webinars/[id]/ai-assistant)
    │               │
    │               ├── [⚙️ AI Settings] ← Configure when to activate
    │               │       └── Toggle "Activate After CTA/Offer"
    │               │
    │               └── [+ Add Document] ← Upload knowledge
    │                       └── Fill form & save
```

---

## 💡 Pro Tips

### Can't Find Your Webinar?
- Make sure you've created at least one webinar first
- Use the search bar if you have many webinars
- Filter by status (DRAFT, PUBLISHED, etc.)

### Button Not Showing?
- Refresh the page after I added it
- Clear browser cache if needed
- Make sure you're on `/dashboard/webinars` (not `/dashboard/webinars/[id]/edit`)

### Testing AI
1. Enable AI in settings
2. Add 3+ documents
3. Go to your live webinar
4. Send a message in chat AFTER the CTA appears
5. AI should respond within 1-2 seconds!

---

## 🎉 Summary

**To access AI settings and upload documents:**

1. Go to **Dashboard → Webinars**
2. Find your webinar in the list
3. Click the purple **"🤖 AI Assistant"** button
4. Click **"⚙️ AI Settings"** (top right) to configure
5. Click **"+ Add Document"** to upload knowledge

**That's it!** The purple AI Assistant button is now visible on every webinar in your list! 🚀

