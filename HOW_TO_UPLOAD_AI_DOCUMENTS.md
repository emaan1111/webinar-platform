# How to Upload AI Program Documents

## 🎯 Current Method: API Only

Currently, there's **no admin UI** for uploading program documents. You need to use the API directly.

---

## 📋 Option 1: Using cURL (Command Line)

### Step 1: Find Your Webinar ID
```bash
# Go to your dashboard and look at the URL when editing a webinar
# Example: /dashboard/webinars/abc123/edit
# Your webinar ID is: abc123
```

### Step 2: Upload a Document
```bash
curl -X POST http://localhost:3000/api/webinars/YOUR_WEBINAR_ID/program-documents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Program Overview",
    "content": "The Islamic Parenting Mastery Program includes 8 comprehensive modules covering: Islamic parenting principles, character development, daily practices, peer pressure, technology management, academic success, emotional intelligence, and future planning. Lifetime access included.",
    "category": "overview",
    "isActive": true
  }'
```

### Step 3: Upload More Documents
```bash
# Pricing Document
curl -X POST http://localhost:3000/api/webinars/YOUR_WEBINAR_ID/program-documents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Pricing & Payment Plans",
    "content": "Full Program: $297 (one-time payment) or 3 payments of $99. Early bird special for webinar attendees: $197 (valid for 48 hours). Includes 8 video modules, workbooks, private community access, monthly Q&A calls, and lifetime updates. 30-day money-back guarantee.",
    "category": "pricing",
    "isActive": true
  }'

# FAQ Document
curl -X POST http://localhost:3000/api/webinars/YOUR_WEBINAR_ID/program-documents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Frequently Asked Questions",
    "content": "Q: How long is the program? A: 8 weeks of content, but you have lifetime access.\n\nQ: Is there a money-back guarantee? A: Yes, 30-day full refund if not satisfied.\n\nQ: Can I access on mobile? A: Yes, fully mobile-responsive.\n\nQ: Are there live sessions? A: Monthly live Q&A calls included.\n\nQ: What if I miss a session? A: All content is recorded and available 24/7.",
    "category": "faq",
    "isActive": true
  }'
```

---

## 📋 Option 2: Using Postman or Insomnia

### 1. Create a New Request
- **Method:** POST
- **URL:** `http://localhost:3000/api/webinars/YOUR_WEBINAR_ID/program-documents`
- **Headers:** 
  - `Content-Type: application/json`

### 2. Add JSON Body
```json
{
  "title": "Program Overview",
  "content": "Your detailed program description here...",
  "category": "overview",
  "isActive": true,
  "sortOrder": 0
}
```

### 3. Send Request
You should get a response like:
```json
{
  "message": "Program document created successfully",
  "document": {
    "id": "doc_123abc",
    "title": "Program Overview",
    "category": "overview",
    ...
  }
}
```

---

## 📋 Option 3: Using Browser Console

### 1. Go to Your Dashboard
Open your browser to `http://localhost:3000/dashboard`

### 2. Open Browser Console
- Chrome/Edge: Press F12 or Ctrl+Shift+I (Windows) / Cmd+Option+I (Mac)
- Firefox: Press F12
- Safari: Cmd+Option+C

### 3. Paste This Code
```javascript
// Replace YOUR_WEBINAR_ID with your actual webinar ID
const webinarId = 'YOUR_WEBINAR_ID';

// Upload Program Overview
fetch(`/api/webinars/${webinarId}/program-documents`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Program Overview',
    content: `The Islamic Parenting Mastery Program is an 8-week comprehensive course designed for Muslim parents. 
    
Includes:
• 8 video modules (45-60 minutes each)
• Downloadable workbooks and checklists
• Private community forum access
• Monthly live Q&A sessions
• Lifetime access to all content and updates
• Certificate of completion`,
    category: 'overview',
    isActive: true
  })
})
.then(r => r.json())
.then(data => console.log('✅ Overview uploaded:', data))

// Upload Pricing
fetch(`/api/webinars/${webinarId}/program-documents`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Pricing & Payment Plans',
    content: `PRICING OPTIONS:
• One-time payment: $297
• 3 monthly payments: $99/month

EARLY BIRD SPECIAL (Webinar Attendees):
• $197 (save $100!)
• Valid for 48 hours after webinar

ALL PLANS INCLUDE:
✓ 8 complete video modules
✓ All workbooks and materials
✓ Private community access
✓ Monthly live Q&A calls
✓ Lifetime access & updates
✓ 30-day money-back guarantee`,
    category: 'pricing',
    isActive: true
  })
})
.then(r => r.json())
.then(data => console.log('✅ Pricing uploaded:', data))

// Upload FAQs
fetch(`/api/webinars/${webinarId}/program-documents`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Frequently Asked Questions',
    content: `Q: How long is the program?
A: 8 weeks of content, but you have lifetime access so you can go at your own pace.

Q: Are sessions live or recorded?
A: All module content is pre-recorded and available 24/7. Monthly Q&A sessions are live but also recorded.

Q: Can I access on mobile/tablet?
A: Yes! The platform works on all devices.

Q: Is there a community?
A: Yes! You get access to our private community forum.

Q: Can I get a refund?
A: Yes, 30-day money-back guarantee—no questions asked.

Q: When does it start?
A: Instant access as soon as you enroll!

Q: Do you offer payment plans?
A: Yes! Pay in full ($297) or 3 payments of $99.

Q: Will I get support?
A: Absolutely! Monthly Q&A sessions plus community forum support.`,
    category: 'faq',
    isActive: true
  })
})
.then(r => r.json())
.then(data => console.log('✅ FAQs uploaded:', data))
```

### 4. Press Enter
You should see success messages in the console!

---

## 📋 Document Categories

| Category | What to Include |
|----------|----------------|
| `overview` | Program description, what's included, duration, who it's for |
| `pricing` | All pricing tiers, payment plans, guarantees, refund policy |
| `faq` | Common questions with detailed answers |
| `curriculum` | Module breakdown, topics covered, learning objectives |
| `testimonials` | Student success stories and results |
| `general` | Any other relevant information |

---

## ✅ Verify Your Documents

### Get All Documents for a Webinar
```bash
curl http://localhost:3000/api/webinars/YOUR_WEBINAR_ID/program-documents
```

### Or in Browser Console:
```javascript
fetch('/api/webinars/YOUR_WEBINAR_ID/program-documents')
  .then(r => r.json())
  .then(data => console.log('Documents:', data))
```

---

## 🔧 Update a Document

### Using cURL:
```bash
curl -X PATCH http://localhost:3000/api/webinars/YOUR_WEBINAR_ID/program-documents \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "doc_abc123",
    "title": "Updated Title",
    "content": "Updated content...",
    "isActive": true
  }'
```

### Using Browser Console:
```javascript
fetch('/api/webinars/YOUR_WEBINAR_ID/program-documents', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    documentId: 'doc_abc123',
    title: 'Updated Title',
    content: 'Updated content...'
  })
})
.then(r => r.json())
.then(data => console.log('Updated:', data))
```

---

## 🗑️ Delete a Document

### Using cURL:
```bash
curl -X DELETE "http://localhost:3000/api/webinars/YOUR_WEBINAR_ID/program-documents?documentId=doc_abc123"
```

### Using Browser Console:
```javascript
fetch('/api/webinars/YOUR_WEBINAR_ID/program-documents?documentId=doc_abc123', {
  method: 'DELETE'
})
.then(r => r.json())
.then(data => console.log('Deleted:', data))
```

---

## 🎨 Want a UI?

I can build an admin UI for managing program documents! It would include:

- ✅ List all documents for a webinar
- ✅ Add new document with form
- ✅ Edit existing documents
- ✅ Delete documents
- ✅ Toggle active/inactive
- ✅ Reorder documents
- ✅ Filter by category
- ✅ Rich text editor for content

Would you like me to build this? It would be located at:
`/dashboard/webinars/[id]/ai-assistant` or `/dashboard/webinars/[id]/program-docs`

---

## 📚 Complete Example Script

Save this as `upload-documents.sh` and run it:

```bash
#!/bin/bash

# Replace with your webinar ID
WEBINAR_ID="YOUR_WEBINAR_ID"
API_URL="http://localhost:3000/api/webinars/$WEBINAR_ID/program-documents"

# Upload Program Overview
curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Program Overview",
    "content": "Complete program description here...",
    "category": "overview",
    "isActive": true
  }'

echo "\n✅ Overview uploaded\n"

# Upload Pricing
curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Pricing & Payment Plans",
    "content": "All pricing details here...",
    "category": "pricing",
    "isActive": true
  }'

echo "\n✅ Pricing uploaded\n"

# Upload FAQs
curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{
    "title": "FAQs",
    "content": "Q&A content here...",
    "category": "faq",
    "isActive": true
  }'

echo "\n✅ FAQs uploaded\n"

echo "🎉 All documents uploaded successfully!"
```

Run it:
```bash
chmod +x upload-documents.sh
./upload-documents.sh
```

---

## 🚀 Quick Summary

**Right now, you have 3 options:**

1. **cURL** - Use terminal commands ← Fastest
2. **Postman/Insomnia** - Use API client ← Easiest to manage
3. **Browser Console** - Use JavaScript ← No extra tools needed

**Recommended:** Use Browser Console method (Option 3) - it's the easiest!

---

## 💡 Pro Tip

Create a file called `my-program-docs.json`:

```json
{
  "overview": "Your program overview content...",
  "pricing": "Your pricing content...",
  "faq": "Your FAQ content..."
}
```

Then upload all at once using this script in browser console:

```javascript
const webinarId = 'YOUR_WEBINAR_ID';
const docs = {
  overview: "Your content...",
  pricing: "Your content...",
  faq: "Your content..."
};

Object.entries(docs).forEach(([category, content]) => {
  fetch(`/api/webinars/${webinarId}/program-documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: category.charAt(0).toUpperCase() + category.slice(1),
      content,
      category,
      isActive: true
    })
  })
  .then(r => r.json())
  .then(data => console.log(`✅ ${category} uploaded`))
});
```

---

**Need help? Check `/AI_KNOWLEDGE_BASE_EXPLAINED.md` for content examples!**
