# Inline Embed Layout Variants

## Overview

The inline embed system now supports **three completely different layouts** based on the selected theme. Each theme has a unique visual design, not just different colors.

## Implementation

### Architecture

Three generator functions create theme-specific CSS:

1. **`generatePurpleInlineStyles(theme)`** - Split-screen layout
2. **`generateBlueInlineStyles(theme)`** - Top banner layout
3. **`generateGreenInlineStyles(theme)`** - Compact card layout

Located in: `/src/app/api/embed/[id]/route.ts` (lines 51-544)

### Usage

```typescript
// Theme selection determines which layout is used
const inlineStylesByTheme = {
  purple: generatePurpleInlineStyles(selectedTheme),
  blue: generateBlueInlineStyles(selectedTheme),
  green: generateGreenInlineStyles(selectedTheme)
}
const inlineStyles = inlineStylesByTheme[theme] || inlineStylesByTheme.purple
```

## Theme Layouts

### 1. Purple Theme - Split Screen Layout

**Design Philosophy**: Professional and balanced, equal emphasis on content and form

**Layout Structure**:
```
┌─────────────────────────────────┐
│ [Icon]                          │ Content (40%)
│ Title                           │ - Gradient background
│ Description                     │ - Features list
│ • Feature 1                     │ - White text
│ • Feature 2                     │
├─────────────────────────────────┤
│ Register Now                    │ Form (60%)
│ ─────────────                   │ - Light gray background
│ [Name Input]                    │ - Vertical accent stripe
│ [Email Input]                   │ - Form fields
│ [Phone Input]                   │
│ [Schedule Select]               │
│ [Register Button]               │
└─────────────────────────────────┘
```

**Key Features**:
- **Max Width**: 1000px
- **Grid**: 2 columns (1fr | 1.2fr)
- **Left Panel**: 
  - Purple gradient background
  - Decorative blur circles (::before, ::after)
  - 70px icon with glassmorphism
  - Features list with checkmarks
- **Right Panel**:
  - Light gray background (#fafafa)
  - 6px vertical accent stripe
  - Form header with bottom border
  - 6px accent bar before title

**Visual Elements**:
- Icon: 70px × 70px, rounded, white overlay, 2px border
- Title: 32px, weight 900, text shadow
- Features: Checkmark circles, rgba white background
- Form title bar: 6px × 28px colored rectangle

**Responsive**:
- Mobile: Stacks to single column
- Left panel: min-height 300px

---

### 2. Blue Theme - Top Banner Layout

**Design Philosophy**: Modern and streamlined, full-width banner with centered content

**Layout Structure**:
```
┌─────────────────────────────────────────┐
│         [Icon]                          │ Banner
│         Title                           │ - Full width
│         Description                     │ - Centered text
│                                         │ - Pattern overlay
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Register Now                        │ │ Form
│ │ Fill in your details                │ │ - Gradient background
│ └─────────────────────────────────────┘ │ - Centered header card
│ [Name Input]                            │
│ [Email Input]                           │
│ [Phone Input]                           │
│ [Schedule Select]                       │
│ [Register Button]                       │
└─────────────────────────────────────────┘
```

**Key Features**:
- **Max Width**: 900px
- **Layout**: Block (not grid)
- **Top Banner**:
  - Blue gradient background
  - Centered text alignment
  - 45° diagonal stripe pattern overlay
  - 80px white icon with colored center
  - 36px bold title
  - 18px description
- **Form Section**:
  - Light gradient background (gray to white)
  - 50px padding all around
  - Form header as white card with shadow
  - Gradient text for title (background-clip: text)

**Visual Elements**:
- Icon: 80px × 80px, white background, blue icon, 20px radius
- Title: 36px, weight 900, white with shadow
- Features list: Hidden (display: none)
- Form header: White card, 16px radius, subtle shadow
- Form title: Gradient text effect

**Unique Styling**:
- Repeating diagonal stripe pattern
- Icon has solid white background (not glassmorphism)
- Form header is a distinct card
- No side-by-side split

**Responsive**:
- Mobile: Reduced padding (30px → 20px)

---

### 3. Green Theme - Compact Card Layout

**Design Philosophy**: Friendly and approachable, centered card with compact design

**Layout Structure**:
```
        ┌───────────────────────┐
        │  ○○○                  │ Top accent bar
┌───────┼───────────────────────┼─────────┐
│       │   ╭─────────────╮     │         │
│       │   │  [Icon]     │     │         │ Content
│       │   ╰─────────────╯     │         │ - Centered
│       │     Title             │         │ - Dashed border
│       │     Description       │         │
│       │  ┌────┐  ┌────┐      │         │
│       │  │ ✓  │  │ ✓  │      │         │ Features grid
│       │  └────┘  └────┘      │         │
│       │  ┌────┐  ┌────┐      │         │
│       │  │ ✓  │  │ ✓  │      │         │
│       │  └────┘  └────┘      │         │
│       ╞═══════════════════════╡         │
│       │  Register Now         │         │ Form
│       │  ───────              │         │ - No background
│       │  [Inputs]             │         │ - Centered title
│       │  [Button]             │         │
└───────┴───────────────────────┴─────────┘
```

**Key Features**:
- **Max Width**: 600px
- **Layout**: Block (not grid)
- **Container**:
  - 3px green border
  - 28px border radius
  - Top accent bar (120px × 6px)
  - Visible overflow for decorative elements
- **Icon**:
  - 100px × 100px circular
  - Green gradient background
  - 4px white border
  - Dashed border decoration (::after pseudo-element)
- **Content Section**:
  - Centered text alignment
  - Dashed border bottom separator
  - Dark green text colors
- **Features Grid**:
  - 2 columns
  - Light green backgrounds (#f0fdf4)
  - Rounded 8px cards
  - Green checkmark circles
- **Form**:
  - Transparent background
  - Centered title with underline accent
  - Smaller, tighter spacing

**Visual Elements**:
- Top bar: 120px × 6px gradient, centered
- Icon decoration: Dashed circle around icon (inset: -12px)
- Title: 28px, weight 900, dark green (#064e3b)
- Features: 2×2 grid, light green cards
- Form title underline: 60px × 4px gradient bar

**Color Palette**:
- Border: #d1fae5 (light green)
- Title: #064e3b (very dark green)
- Description: #047857 (dark green)
- Features bg: #f0fdf4 (very light green)
- Features text: #065f46 (dark green)

**Responsive**:
- Mobile: Single column features grid
- Reduced padding (40px → 24px)

---

## Form Components

All three themes share common form elements with theme-specific styling:

### Shared Elements

- **Form inputs**: 14-16px padding, 2px border, 10px radius
- **Labels**: 600 weight, 14px, gray (#374151)
- **Buttons**: Full width, gradient backgrounds
- **Trust badge**: Theme-colored with lock icon
- **Error messages**: Red text, flex with icon
- **Success state**: Green gradient circle icon

### Theme-Specific Form Styling

**Purple**:
- Button: Theme gradient background
- Focus ring: 3px purple shadow
- Trust badge: Purple accent, left border

**Blue**:
- Button: Theme gradient background  
- Focus ring: 3px blue shadow
- Trust badge: Blue accent, left border
- Form header: White card with shadow

**Green**:
- Button: Theme gradient background
- Focus ring: 3px green shadow  
- Trust badge: Green accent, left border
- Form title: Underline accent

---

## Technical Details

### Generator Functions

Each function:
1. Accepts a `theme` object with colors
2. Returns a template string with complete CSS
3. Interpolates theme colors into styles
4. Includes all necessary selectors
5. Handles responsive breakpoints

### Theme Object Structure

```typescript
{
  headerBg: 'linear-gradient(...)',  // Background gradient
  buttonBg: 'linear-gradient(...)',  // Button gradient
  buttonHoverBg: 'linear-gradient(...)',  // Button hover
  focusColor: '#hex',  // Accent color for borders, focus, etc.
  headerText: '#ffffff'  // Text color on header
}
```

### CSS Classes

Common prefix: `.webinar-embed-inline-`

**Purple & Green**:
- `.webinar-embed-inline-grid` - Container grid
- `.webinar-embed-inline-left` - Content panel
- `.webinar-embed-inline-right` - Form panel

**Blue**:
- `.webinar-embed-inline-grid` - Block container (not grid)
- `.webinar-embed-inline-left` - Banner section
- `.webinar-embed-inline-right` - Form section

**All Themes**:
- `.webinar-embed-inline-icon` - Icon container
- `.webinar-embed-inline-title` - Main heading
- `.webinar-embed-inline-desc` - Description text
- `.webinar-embed-inline-features` - Features list
- `.webinar-embed-inline-form-header` - Form title section
- `.webinar-embed-inline-form-title` - Form heading
- `.webinar-embed-inline-form-subtitle` - Form subheading

---

## Testing

### Preview Each Theme

In the dashboard:
1. Go to Webinars page
2. Click "Get Embed Code"
3. Select "Inline Form"
4. Click each theme swatch (Purple/Blue/Green)
5. Observe completely different layouts in preview

### Verify Layouts

**Purple**: Should show split-screen with gradient left panel  
**Blue**: Should show full-width banner at top
**Green**: Should show compact centered card

### Test Responsiveness

Resize browser to test mobile breakpoints:
- Purple: Should stack vertically
- Blue: Should maintain layout with smaller padding
- Green: Should switch features to single column

### Test Form Functionality

For each theme:
1. Fill in all form fields
2. Submit registration
3. Verify success message appears
4. Check that form validation works
5. Test country code selector

---

## Migration Notes

### Breaking Changes

❌ **Old**: All inline embeds had same layout with different colors  
✅ **New**: Each theme has unique layout structure

### Backwards Compatibility

Existing embedded forms will automatically use the new Purple layout (default), which closely matches the old inline design.

### Customization

To modify a specific theme layout:
1. Edit the appropriate generator function
2. Styles are pure CSS strings with template interpolation
3. No need to restart - changes reflected on next embed load

---

## Future Enhancements

### Potential Additions

1. **Additional Themes**: Orange, teal, pink variants
2. **Layout Options**: Add more layout choices per theme
3. **Hybrid Layouts**: Mix elements from different themes
4. **Custom CSS**: Allow users to override with custom CSS
5. **Animation Options**: Add entrance animations per layout
6. **Image Backgrounds**: Support background images in banners

### Configuration API

Could add configuration parameters:
```
?theme=blue&variant=compact&animation=fade
```

---

## Summary

The inline embed system now provides true visual diversity:

- **3 unique layouts** (not just color variations)
- **Theme-specific designs** (split, banner, card)
- **Maintained form functionality** (all layouts work identically)
- **Responsive designs** (mobile-friendly breakpoints)
- **Easy customization** (generator function pattern)

Each theme tells a different visual story while maintaining the same registration functionality.
