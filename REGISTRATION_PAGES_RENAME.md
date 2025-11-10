# Renamed: Templates → Registration Pages

## What Changed

### 1. **Menu Label**
- **Before**: "Templates"
- **After**: "Registration Pages"
- **Location**: Left sidebar navigation

### 2. **Page Titles**
- **List Page**: "Registration Pages" 
  - Subtitle: "Manage your custom registration page designs"
- **Create Page**: "Create New Registration Page"
  - Subtitle: "Create a custom registration page design with your own HTML, CSS, and JavaScript"

### 3. **Webinar Edit Form**
- **Section Title**: "Registration Page Design"
- **Field Label**: "Page Design"
- **Default Option**: "Default Design (Recommended)"
- **Help Text**: "💡 Use the default design for reliability, or select a custom registration page design."

### 4. **Button Labels**
- "Create New Page" (list page)
- "Preview Design →" (when selected)

## What This Clarifies

### Registration Pages (formerly "Templates")
- **Purpose**: Full custom HTML/CSS/JS registration pages
- **Used at**: `/w/[slug]` - the main registration URL
- **Features**: 
  - Upload complete HTML pages
  - Button detection system
  - Variable replacement ({{webinar.title}}, etc.)
  - Preview functionality
- **When to use**: When you want complete control over the registration page design

### Embeddable Forms (separate system)
- **Purpose**: Small opt-in forms to embed on external websites
- **Used at**: Any website (via embed code)
- **Features**:
  - 4 beautiful themes
  - Inline or popup styles
  - Copy/paste embed code
  - No conflicts, we control the code
- **When to use**: When you want to add registration to your own website

## User Flow

### For Registration Pages:
1. Go to "Registration Pages" in sidebar
2. Click "Create New Page"
3. Name it, add HTML/CSS/JS
4. Detect & mark registration buttons
5. Save
6. Go to webinar edit
7. Select your page design
8. Share `/w/[slug]` link

### For Embeddable Forms:
1. Go to webinar edit page
2. Scroll to "📋 Embed Registration Form"
3. Choose theme and type
4. Copy embed code
5. Paste on your website
6. Done!

## Technical Notes

- **Database**: Still uses `Template` model (no migration needed)
- **API Routes**: Still at `/api/templates/*` (backward compatible)
- **URLs**: Still at `/dashboard/templates/*` (no breaking changes)
- **Only UI labels changed** - all functionality remains the same

## Benefits

✅ **Clearer Purpose**: Users understand what "Registration Pages" are
✅ **Less Confusion**: Distinguished from "Embeddable Forms"
✅ **Better UX**: More descriptive labels and help text
✅ **No Breaking Changes**: All existing code still works
