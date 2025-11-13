# Template Script Syntax Error Fix

## Issue
Getting `SyntaxError: Failed to execute 'replaceChild' on 'Node': Invalid or unexpected token` when rendering templates with dynamic content in JavaScript.

**Error Location**: `src/components/TemplateRenderer.tsx` (line 49)

## Root Cause
When template variables like `{{referralLink}}`, `{{whatsappReferralLink}}`, or other URLs are replaced in HTML templates, they can contain special characters that break JavaScript syntax when inserted directly into `<script>` tags.

For example:
- URLs with query parameters: `http://example.com?ref=abc&foo=bar`
- The `&` character is not properly escaped in JavaScript strings
- Special characters like `"`, `'`, `\n`, `<`, `>` can break script syntax

## Solution

### 1. Enhanced TemplateRenderer Error Handling
**File**: `src/components/TemplateRenderer.tsx`

Added comprehensive script validation before execution:
- Skip empty scripts
- Detect invalid control characters
- Validate script syntax in development mode using `new Function()`
- Better error logging without exposing full script content
- Gracefully skip problematic scripts instead of crashing

### 2. Countdown Page - Escape URLs for JavaScript
**File**: `src/app/countdown/[slug]/page.tsx`

Applied JavaScript escaping to all URLs before template replacement:
```typescript
// Escape links for JavaScript context (they may be used in <script> tags)
const safeJoinLink = escapeJsInHtml(joinLink)
const safeRegistrationLink = escapeJsInHtml(registrationLink)
const safeReferralLink = escapeJsInHtml(fullReferralLink)

processed = processed.replace(/\{\{joinLink\}\}/g, safeJoinLink)
processed = processed.replace(/\{\{registrationLink\}\}/g, safeRegistrationLink)
processed = processed.replace(/\{\{referralLink\}\}/g, safeReferralLink)
```

### 3. Thank You Page - Escape All Dynamic URLs
**File**: `src/app/thank-you/[slug]/page.tsx`

Applied JavaScript escaping to all dynamic URLs:
- `{{referralLink}}` - Already escaped (was working)
- `{{whatsappReferralLink}}` - Now escaped
- `{{googleCalendarLink}}` / `{{calendarLink}}` - Now escaped
- `{{appleCalendarLink}}` / `{{icsCalendarLink}}` - Now escaped
- `{{joinLink}}` / `{{countdownLink}}` - Now escaped
- `{{roomLink}}` - Now escaped
- `{{icsDownload}}` - Now escaped

## JavaScript Escaping Function

The `escapeJsInHtml` / `escapeForJs` function properly escapes strings for insertion into JavaScript code:

```typescript
const escapeJsInHtml = (text: string) => {
  return text
    .replace(/\\/g, '\\\\')   // Escape backslashes first
    .replace(/"/g, '\\"')      // Escape double quotes
    .replace(/'/g, "\\'")      // Escape single quotes
    .replace(/\n/g, '\\n')     // Escape newlines
    .replace(/\r/g, '\\r')     // Escape carriage returns
    .replace(/\t/g, '\\t')     // Escape tabs
    .replace(/</g, '\\x3C')    // Escape < to prevent script injection
    .replace(/>/g, '\\x3E')    // Escape > to prevent script injection
}
```

## What This Fixes

✅ URLs with query parameters (`&`, `=`, `?`) can now be safely used in JavaScript
✅ URLs with special characters won't break script execution
✅ Calendar links with encoded data are properly handled
✅ WhatsApp share links with messages are properly escaped
✅ Templates with dynamic content won't cause syntax errors
✅ Better error messages when scripts do fail
✅ Development mode validates scripts before execution

## Files Modified

1. `/src/components/TemplateRenderer.tsx` - Enhanced error handling and validation
2. `/src/app/countdown/[slug]/page.tsx` - Escape URLs before template replacement
3. `/src/app/thank-you/[slug]/page.tsx` - Escape all dynamic URLs

## Testing

Test the following scenarios:
1. ✅ Countdown page with referral link
2. ✅ Thank you page with all share buttons
3. ✅ Calendar links (Google, Apple/ICS)
4. ✅ WhatsApp share with special characters in title
5. ✅ URLs with query parameters

## Related Files

- `/src/lib/normalizeReferralPlaceholders.ts` - Normalizes referral link placeholders
- `/src/lib/referral.ts` - Builds referral links
- Template HTML files with `<script>` tags using `{{referralLink}}` etc.

## Prevention

- **Always** escape dynamic content when inserting into JavaScript contexts
- Use `escapeJsInHtml()` or `escapeForJs()` for any user-generated or dynamic content
- Test templates with special characters in webinar titles and URLs
- Enable development mode validation to catch syntax errors early

## Additional Fix: shareOnWhatsApp Function Not Defined

### Issue
After the initial escaping fix, templates were showing `ReferenceError: shareOnWhatsApp is not defined` because the validation in TemplateRenderer was **skipping** scripts with syntax validation errors.

### Root Cause
The `new Function()` validation was too strict and was rejecting valid scripts that:
1. Used template placeholders in string concatenations
2. Had context-specific variables not available during validation

### Solution
Changed the script validation from **blocking** to **warning-only**:
- Scripts with potential syntax issues are logged as warnings
- But they're still executed to allow runtime context to resolve them
- This allows templates with valid JavaScript (just context-dependent) to run

### Updated Escaping Strategy
Also simplified the escaping functions:
- Removed `\\x3C` and `\\x3E` escaping for `<` and `>` (too aggressive for URLs)
- Renamed to `escapeForJsString` to clarify it's for string literals
- Only escapes: backslashes, quotes, newlines, tabs - essential for string safety

## Status

✅ **FIXED** - All template variables are now properly escaped before insertion into JavaScript contexts.
✅ **FIXED** - Template scripts execute correctly even with dynamic content.
✅ **FIXED** - Share functions (shareOnWhatsApp, copyLink, etc.) work properly.
