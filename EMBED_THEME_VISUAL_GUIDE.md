# Embed Theme Visual Guide 🎨

## Quick Reference: Which Theme to Use?

```
┌─────────────────────────────────────────────────────────────┐
│                    THEME SELECTION GUIDE                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🟣 PURPLE - Professional & Detailed                        │
│     Use when: Complex webinar, detailed benefits           │
│     Layout: Side-by-side split                             │
│     Info: Left panel with feature list                     │
│     Audience: Corporate, B2B, Professional                 │
│                                                             │
│  🔵 BLUE - Clean & Marketing                                │
│     Use when: Simple registration, clear CTA               │
│     Layout: Top banner + form below                        │
│     Info: Full-width header banner                         │
│     Audience: Marketing campaigns, B2C                     │
│                                                             │
│  🟢 GREEN - Quick & Compact                                 │
│     Use when: Mobile-first, fast signup                    │
│     Layout: Centered card with icon                        │
│     Info: Compact header with emoji                        │
│     Audience: Social media, mobile, urgent                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🟣 Purple Theme: Split-Screen Layout

### Visual Structure
```
┌──────────────────────────────────────────────────────┐
│                     Max Width: 1000px                │
├──────────────────────┬───────────────────────────────┤
│                      │                               │
│   GRADIENT INFO      │      FORM (on #fafafa)       │
│   PANEL (40%)        │         (60%)                │
│                      │                               │
│  • Title (32px)      │  [Input: Name]               │
│  • Description       │  [Input: Email]              │
│                      │  [Input: Phone]              │
│  ✓ Feature 1         │  [Select: Time]              │
│  ✓ Feature 2         │                               │
│  ✓ Feature 3         │  [Button: Register]          │
│  ✓ Feature 4         │                               │
│                      │                               │
└──────────────────────┴───────────────────────────────┘
    Purple Gradient           Light Gray BG
```

### CSS Classes
```css
.webinar-embed-inline              // Container
.webinar-embed-inline-grid         // Grid wrapper (1fr + 1.2fr)
.webinar-embed-inline-info         // Left info panel
.webinar-embed-inline-features     // Feature list (checkmarks)
.webinar-embed-inline-form         // Right form area
```

### HTML Structure
```html
<div class="webinar-embed-inline">
  <div class="webinar-embed-inline-grid">
    <div class="webinar-embed-inline-info">
      <h2>Webinar Title</h2>
      <p>Description</p>
      <ul class="webinar-embed-inline-features">
        <li>Live Q&A with experts</li>
        <li>Exclusive insights</li>
        <li>Certificate</li>
        <li>Networking</li>
      </ul>
    </div>
    <div class="webinar-embed-inline-form">
      <form>...</form>
    </div>
  </div>
</div>
```

---

## 🔵 Blue Theme: Top Banner Layout

### Visual Structure
```
┌──────────────────────────────────────────────────────┐
│                  Max Width: 900px                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│           GRADIENT BANNER (Full Width)              │
│                                                      │
│              Title (36px, centered)                 │
│            Description (18px)                       │
│                                                      │
│──────────────────────────────────────────────────────│ ← Decorative line
│                                                      │
│         FORM SECTION (White Background)             │
│                                                      │
│    "Complete the form below to register"            │
│                                                      │
│             [Input: Name]                           │
│             [Input: Email]                          │
│             [Input: Phone]                          │
│             [Select: Time]                          │
│                                                      │
│             [Button: Register]                      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### CSS Classes
```css
.webinar-embed-inline              // Container
.webinar-embed-inline-banner       // Top gradient banner
.webinar-embed-inline-form         // Form section
.webinar-embed-inline-form-title   // Form heading
```

### HTML Structure
```html
<div class="webinar-embed-inline">
  <div class="webinar-embed-inline-banner">
    <h2>Webinar Title</h2>
    <p>Description</p>
  </div>
  <div class="webinar-embed-inline-form">
    <div class="webinar-embed-inline-form-title">
      Complete the form below to register
    </div>
    <form>...</form>
  </div>
</div>
```

---

## 🟢 Green Theme: Compact Card Layout

### Visual Structure
```
┌──────────────────────────────────────┐
│        Max Width: 600px              │
├──────────────────────────────────────┤
│  ┌────────────────────────────────┐  │
│  │                                │  │ ← 3px gradient border
│  │        ┌──────────┐            │  │
│  │        │   🎯    │            │  │ ← Icon badge
│  │        └──────────┘            │  │
│  │                                │  │
│  │   Title (28px, centered)      │  │
│  │   Description (16px)          │  │
│  │                                │  │
│  ├────────────────────────────────┤  │ ← Border separator
│  │                                │  │
│  │     [Input: Name]              │  │
│  │     [Input: Email]             │  │
│  │     [Input: Phone]             │  │
│  │     [Select: Time]             │  │
│  │                                │  │
│  │     [Button: Register]         │  │
│  │                                │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

### CSS Classes
```css
.webinar-embed-inline               // Container (gradient border)
.webinar-embed-inline-card-header   // Header section
.webinar-embed-inline-icon          // Icon badge (64x64)
.webinar-embed-inline-form          // Form section
```

### HTML Structure
```html
<div class="webinar-embed-inline">
  <div class="webinar-embed-inline-card-header">
    <div class="webinar-embed-inline-icon">🎯</div>
    <h2>Webinar Title</h2>
    <p>Description</p>
  </div>
  <div class="webinar-embed-inline-form">
    <form>...</form>
  </div>
</div>
```

---

## Side-by-Side Comparison

### Desktop View

```
┌──────────────────┬──────────────────┬──────────────────┐
│   PURPLE (1000)  │   BLUE (900)     │   GREEN (600)    │
├──────────────────┼──────────────────┼──────────────────┤
│                  │                  │                  │
│ ┌────────┬─────┐ │ ┌──────────────┐ │   ┌──────────┐   │
│ │ INFO   │FORM │ │ │   BANNER     │ │   │  ICON 🎯 │   │
│ │ PANEL  │AREA │ │ └──────────────┘ │   ├──────────┤   │
│ │        │     │ │                  │   │  HEADER  │   │
│ │ ✓ List │Input│ │ ┌──────────────┐ │   ├──────────┤   │
│ │ ✓ List │Input│ │ │              │ │   │   FORM   │   │
│ │ ✓ List │Input│ │ │     FORM     │ │   │          │   │
│ │ ✓ List │     │ │ │              │ │   └──────────┘   │
│ └────────┴─────┘ │ └──────────────┘ │                  │
│                  │                  │                  │
└──────────────────┴──────────────────┴──────────────────┘
 Split-screen        Top banner         Compact card
```

### Mobile View (<768px)

```
┌───────────────────────────────────────────────────────┐
│                  ALL THEMES STACK                     │
├───────────────────────────────────────────────────────┤
│                                                       │
│  Purple:  Info Panel → Form (vertical stack)         │
│  Blue:    Banner → Form (already vertical)           │
│  Green:   Header → Form (already vertical)           │
│                                                       │
│  All reduce padding from 48px → 32px/24px            │
│                                                       │
└───────────────────────────────────────────────────────┘
```

---

## Theme Colors Reference

### Purple Theme
```css
headerBg: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)
buttonBg: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)
buttonHover: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)
focus: #8b5cf6
```

### Blue Theme
```css
headerBg: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)
buttonBg: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)
buttonHover: linear-gradient(135deg, #2563eb 0%, #0891b2 100%)
focus: #3b82f6
```

### Green Theme
```css
headerBg: linear-gradient(135deg, #10b981 0%, #059669 100%)
buttonBg: linear-gradient(135deg, #10b981 0%, #059669 100%)
buttonHover: linear-gradient(135deg, #059669 0%, #047857 100%)
focus: #10b981
```

---

## Use Cases & Examples

### 🟣 Purple - Professional Webinar
**Scenario**: "Advanced Marketing Strategies for 2025"
- **Why Purple**: Detailed features list shows value proposition
- **Audience**: Professional marketers, business owners
- **Content**: Complex topic requires explaining benefits
- **Features Shown**:
  - Live Q&A with industry experts
  - Exclusive insider strategies
  - Certificate of completion
  - Premium networking opportunities

### 🔵 Blue - Simple Product Launch
**Scenario**: "New Product Demo - Free Registration"
- **Why Blue**: Clean, marketing-focused, clear CTA
- **Audience**: General consumers, product enthusiasts
- **Content**: Simple registration, get them in fast
- **Banner**: Eye-catching announcement at top

### 🟢 Green - Quick Social Media Signup
**Scenario**: "Flash Webinar: Join in 5 Minutes!"
- **Why Green**: Ultra-compact, mobile-friendly, urgent
- **Audience**: Social media followers, mobile users
- **Content**: Quick signup, minimal friction
- **Icon**: 🎯 targets = "Don't miss this opportunity"

---

## Testing URLs

### Preview Each Theme
```
Purple: /api/embed/[id]/preview?theme=purple&type=inline
Blue:   /api/embed/[id]/preview?theme=blue&type=inline
Green:  /api/embed/[id]/preview?theme=green&type=inline
```

### Embed Each Theme
```html
<!-- Purple Split-Screen -->
<script src="/api/embed/[id]?theme=purple&type=inline"></script>
<div id="webinar-embed-[id]"></div>

<!-- Blue Top Banner -->
<script src="/api/embed/[id]?theme=blue&type=inline"></script>
<div id="webinar-embed-[id]"></div>

<!-- Green Compact Card -->
<script src="/api/embed/[id]?theme=green&type=inline"></script>
<div id="webinar-embed-[id]"></div>
```

---

## Implementation Notes

### All Themes Share
- Same form fields (name, email, phone, schedule)
- Same validation logic
- Same submission endpoint
- Same success message
- Same trust badge
- Same country code selector

### Only Layout/Design Differs
- Container structure (grid vs stack vs card)
- Header presentation (side panel vs banner vs icon)
- Spacing and padding
- Visual hierarchy
- Color accents (gradient)

### Form Styles (Consistent Across All)
```css
.webinar-embed-input         // Text inputs
.webinar-embed-select        // Dropdowns
.webinar-embed-button        // Submit button
.webinar-embed-label         // Field labels
.webinar-embed-error         // Validation errors
.webinar-embed-trust-badge   // Security message
```

---

**Last Updated**: November 17, 2025
**File**: `/src/app/api/embed/[id]/route.ts`
**Status**: ✅ All themes production-ready
