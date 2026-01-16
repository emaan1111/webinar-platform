# Registration Popup - Location & Embed Guide

## 📍 Where This Popup Is Located

The "Secure Your Spot!" popup you see in the screenshot is the **React-based registration modal** that's part of your main application system.

### Component Location
**File:** `/src/components/registration-pages/RegistrationModal.tsx`

This is a reusable React component that can be triggered from:
1. **Custom registration page templates** (when users click CTA buttons)
2. **Webinar landing pages** (`/w/[slug]`)
3. **Direct links with auto-open** (`/w/[slug]?register=true`)

### How It's Used in `page-client.tsx`
**File:** `/src/app/w/[slug]/page-client.tsx`

The modal is integrated at **line 1157** and **line 1532**, showing two instances:
- One for the main webinar page
- One for schedule selection flow

## 🎨 Features of This Popup

✅ **Schedule Selection** - Dropdown with multiple webinar times  
✅ **Timezone Support** - Shows times in user's timezone with "Change" option  
✅ **Phone Number Input** - International format with country code selector  
✅ **Privacy Policy Consent** - Checkbox with links  
✅ **Trust Badges** - "100% Secure" and "No Spam" indicators  
✅ **Gradient Header** - Purple/blue gradient design  
✅ **Form Validation** - Required fields marked with *  
✅ **Responsive Design** - Works on mobile and desktop  

## 💻 Getting Embed Code for a Specific Webinar

### Option 1: Via Dashboard UI

1. **Navigate to**: Dashboard → Webinars → [Your Webinar] → Edit
2. **Scroll to**: "Embed Code Generator" section (near bottom of edit page)
3. **Configure**:
   - Choose **Form Type**: `Inline` or `Popup`
   - Choose **Theme**: `Registration Style`, `Corporate`, `Material`, or `Playful`
4. **Click**: "Copy Code" button
5. **Paste**: Into your website's HTML

### Option 2: Direct URL Pattern

For any webinar, the embed code API endpoint is:

```
https://emaanpowerclasses.com/api/embed/[WEBINAR_ID]?theme=[THEME]&type=[TYPE]
```

**Parameters:**
- `WEBINAR_ID` - The unique ID of your webinar (found in database or URL)
- `theme` - `registration`, `purple`, `blue`, or `green` (default: `registration`)
- `type` - `inline` or `popup` (default: `inline`)

### Embed Code Examples

#### Inline Form (Shows directly on page)
```html
<!-- Webinar Registration Form -->
<div id="webinar-embed-WEBINAR_ID"></div>
<script src="https://emaanpowerclasses.com/api/embed/WEBINAR_ID?theme=registration&type=inline"></script>
```

#### Popup Form (Opens when button clicked)
```html
<!-- Add this to your button -->
<button data-webinar-popup="WEBINAR_ID">Register for Webinar</button>

<!-- Add this script anywhere on your page -->
<script src="https://emaanpowerclasses.com/api/embed/WEBINAR_ID?theme=registration&type=popup"></script>
```

## 🎯 Available Themes

| Theme | Description | Best For |
|-------|-------------|----------|
| `registration` | Modern with trust badges, gradient header | Professional webinars |
| `purple` | Corporate purple gradient | Business/corporate |
| `blue` | Material design, card-based | Tech/SaaS products |
| `green` | Playful, bold & vibrant | Creative/casual events |

## 📱 Where Embed Component Lives

**Component:** `/src/components/dashboard/EmbedCodeGenerator.tsx`

**Used in:** `/src/app/dashboard/webinars/[id]/edit/page.tsx` (line 2089)

This component provides:
- Visual theme previews
- Live code generation
- One-click copy to clipboard
- Preview button to see how it looks
- Direct registration link

## 🔗 API Routes

**Main Embed API:** `/src/app/api/embed/[id]/route.ts`

This generates the JavaScript that creates the registration form with:
- Full HTML/CSS/JS injected into client site
- CORS enabled for cross-domain embedding
- Automatic styling isolation (no conflicts with host site)
- Real-time schedule fetching
- Form submission handling

## 🚀 Quick Access

To get embed code for a specific webinar:

1. **Copy webinar ID** from URL or database
2. **Visit**: `https://emaanpowerclasses.com/dashboard/webinars/[WEBINAR_ID]/edit`
3. **Scroll to**: "Embed Code Generator" section
4. **Select theme and type**
5. **Click copy** - Done!

## 📊 Popup vs Custom Template Modal

Your application has **TWO** registration modal systems:

### 1. React Popup (Shown in Screenshot)
- **File:** `RegistrationModal.tsx`
- **Managed by:** React state
- **Used for:** Standard webinar pages, embeds
- **Features:** Full schedule selection, timezone support, phone validation

### 2. Custom Template Modals (e.g., RH 2)
- **Location:** Inside HTML templates (like `emaan-power-royal.html`)
- **Managed by:** Vanilla JavaScript
- **Used for:** Custom-designed registration pages
- **Features:** Template-specific styling, inline scripts

The popup in your screenshot is **Type 1** (React-based system modal).

## 🔧 Customization

To customize the popup appearance:
1. Edit `/src/components/registration-pages/RegistrationModal.tsx`
2. Modify colors, text, or layout
3. Changes apply to ALL webinars using this modal

To create a custom modal for specific webinars:
- Create custom registration page template (like RH 2)
- Add your own HTML/CSS/JS
- Assign to specific webinar

---

**Summary:** The popup is at `RegistrationModal.tsx`, and you can get embed code through the Dashboard → Edit Webinar → Embed Code Generator section at the bottom of the page.
