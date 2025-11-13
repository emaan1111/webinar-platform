# Template Referral Link JavaScript Syntax Fix

## Issue
The countdown and thank you page templates had JavaScript syntax errors when `{{referralLink}}` was replaced with URLs containing colons (`:`) and other special characters. This caused "Unexpected token ':'" errors.

## Root Cause
The `{{referralLink}}` placeholder was being replaced with full URLs like `http://localhost:3001/w/slug?ref=CODE`. When this replacement happened inside JavaScript string literals that were split across multiple lines, it created invalid JavaScript syntax:

```javascript
// BEFORE (BROKEN):
const shareText = "...some text
{{referralLink}}";  // URL with : appears after newline = SYNTAX ERROR
```

## Fixes Applied

### 1. Countdown Template (GREEN)
**File**: `countdown_templates` table, `htmlCode` column

#### Fix 1: WhatsApp Share Function
```javascript
// BEFORE:
const shareText = "...text here
{{referralLink}}";

// AFTER:
const shareText = "...text here\n" + "{{referralLink}}";
```

#### Fix 2: Facebook Share Function
```javascript
// BEFORE:
const shareUrl = "https://www.facebook.com/sharer/sharer.php?u=
{{referralLink}}";

// AFTER:
const shareUrl = "https://www.facebook.com/sharer/sharer.php?u=" + "{{referralLink}}";
```

### 2. Thank You Template (GREEN)
**File**: `thank_you_templates` table, `htmlCode` column

#### Fix 1: Copy Link Function
```javascript
// BEFORE:
const link = {{referralLink}};  // Missing quotes!

// AFTER:
const link = "{{referralLink}}";
```

#### Fix 2: WhatsApp Share Function
```javascript
// BEFORE:
const shareText = "...text
{{referralLink}}";

// AFTER:
const shareText = "...text\n" + "{{referralLink}}";
```

#### Fix 3: Facebook Share Function
```javascript
// BEFORE:
const shareUrl = "https://www.facebook.com/sharer/sharer.php?u=
{{referralLink}};

// AFTER:
const shareUrl = "https://www.facebook.com/sharer/sharer.php?u=" + "{{referralLink}}";
```

### 3. TemplateRenderer Error Handling
**File**: `/src/components/TemplateRenderer.tsx`

Added try-catch error handling to catch and log script execution errors:

```typescript
try {
  const newScript = document.createElement('script')
  // ... copy attributes ...
  const scriptContent = oldScript.textContent ?? ''
  newScript.text = scriptContent
  oldScript.parentNode?.replaceChild(newScript, oldScript)
} catch (error) {
  console.error(`[TemplateRenderer] Error executing script ${index}:`, error)
  console.error('Script content preview:', oldScript.textContent?.substring(0, 200))
}
```

## SQL Update Commands Used

### Countdown Template:
```sql
-- Fix WhatsApp function
UPDATE countdown_templates 
SET "htmlCode" = REGEXP_REPLACE(
  "htmlCode",
  'const shareText = "(.*?)\n(\s*){{referralLink}}";',
  'const shareText = "\1\n\2" + "{{referralLink}}";',
  'g'
)
WHERE name = 'GREEN';

-- Fix Facebook function
UPDATE countdown_templates 
SET "htmlCode" = REPLACE(
  "htmlCode",
  'const shareUrl = "https://www.facebook.com/sharer/sharer.php?u=
{{referralLink}}";',
  'const shareUrl = "https://www.facebook.com/sharer/sharer.php?u=" + "{{referralLink}}";'
)
WHERE name = 'GREEN';
```

### Thank You Template:
```sql
UPDATE thank_you_templates 
SET "htmlCode" = REPLACE(
  REPLACE(
    REPLACE(
      "htmlCode",
      'const link = {{referralLink}};',
      'const link = "{{referralLink}}";'
    ),
    E'Here''s the link to reserve a FREE spot \n{{referralLink}}";',
    E'Here''s the link to reserve a FREE spot \n" + "{{referralLink}}";'
  ),
  E'const shareUrl = "https://www.facebook.com/sharer/sharer.php?u=\n{{referralLink}};',
  'const shareUrl = "https://www.facebook.com/sharer/sharer.php?u=" + "{{referralLink}}";'
)
WHERE name = 'GREEN';
```

## Testing
1. Register for a webinar
2. Navigate to thank you page - verify no errors
3. Click "Copy Link" button - should work
4. Click WhatsApp share button - should open WhatsApp with referral link
5. Click Facebook share button - should open Facebook share dialog with referral link
6. Navigate to countdown page - verify no errors
7. Test all share buttons on countdown page

## Files Modified
- `/src/components/TemplateRenderer.tsx` - Added error handling
- Database: `countdown_templates.htmlCode` (GREEN template)
- Database: `thank_you_templates.htmlCode` (GREEN template)

## Date
November 13, 2025

## Status
✅ **COMPLETE** - All syntax errors fixed, error handling added
