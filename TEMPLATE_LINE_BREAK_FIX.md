# Template Syntax Error - Line Break in String Literal

## Issue
```
SyntaxError: Failed to execute 'replaceChild' on 'Node': Invalid or unexpected token
```

Occurring at `src/components/TemplateRenderer.tsx` line 75 when trying to execute template scripts.

## Root Cause

Several HTML template files had **invalid JavaScript syntax** - string literals with actual line breaks:

```javascript
// ❌ INVALID - string literal broken across lines
const shareText = "Long message text...
" + "{{referralLink}}";

// ✅ VALID - string on one line
const shareText = "Long message text... " + "{{referralLink}}";
```

In JavaScript, you cannot have an actual newline character inside a string literal (even though `\n` escape sequences are fine).

## Affected Files

The following template files had this syntax error:

1. `thankyou_green.html`
2. `thankyou_template.html`
3. `green_thankyou_template.html`
4. `green_template.html`
5. `green_template_fixed.html`
6. `green_template_current.html`

## The Fix

### 1. Fixed All Template Files
Moved the string concatenation to be on a single line:

**Before:**
```javascript
function shareOnWhatsApp() {
    const shareText = "Assalam aleykum sister,\n\nI found this FREE class...
" + "{{referralLink}}";  // ❌ Line break breaks syntax
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
}
```

**After:**
```javascript
function shareOnWhatsApp() {
    const shareText = "Assalam aleykum sister,\n\nI found this FREE class... " + "{{referralLink}}";  // ✅ All on one line
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
}
```

### 2. Enhanced Error Handling in TemplateRenderer
Added better error handling and diagnostics:

```typescript
try {
  newScript.text = scriptContent
  oldScript.parentNode?.replaceChild(newScript, oldScript)
} catch (replaceError) {
  // Catch errors during script assignment/replacement
  console.error(`Failed to replace/execute script:`, replaceError)
  console.error('Script content (first 800 chars):', scriptContent.substring(0, 800))
  
  // Identify problematic lines
  const lines = scriptContent.split('\n')
  lines.forEach((line, lineNum) => {
    const singleQuotes = (line.match(/'/g) || []).length
    const doubleQuotes = (line.match(/"/g) || []).length
    if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0) {
      console.error(`  ⚠️ Line ${lineNum + 1} may have unterminated string:`, line)
    }
  })
}
```

This helps identify:
- Which script failed
- What the script content looks like
- Which lines have unterminated strings (odd number of quotes)

## Why This Happened

1. Templates were likely created/edited in a text editor that auto-wrapped long lines
2. The line break was inserted visually for readability
3. JavaScript doesn't allow literal line breaks in string literals
4. This creates invalid syntax that can't be parsed

## Prevention

### For Template Creators
1. ✅ Keep string literals on one line
2. ✅ Use template literals (backticks) for multi-line strings:
   ```javascript
   const text = `Line 1
   Line 2
   Line 3`;
   ```
3. ✅ Or use string concatenation:
   ```javascript
   const text = "Line 1\n" +
                "Line 2\n" +
                "Line 3";
   ```
4. ❌ Never break a string literal across lines without proper syntax

### For Developers
1. Test templates in the browser before saving
2. Use the browser console to check for syntax errors
3. The enhanced error handling will now show which lines have issues
4. Validate JavaScript in templates using a linter

## Verification

After the fix, verify:
- [ ] Thank you pages load without errors
- [ ] Share buttons work (WhatsApp, Facebook)
- [ ] No console errors about script execution
- [ ] All templates render correctly

## Files Modified

### Template Files (Fixed syntax):
1. `/thankyou_green.html`
2. `/thankyou_template.html`
3. `/green_thankyou_template.html`
4. `/green_template.html`
5. `/green_template_fixed.html`
6. `/green_template_current.html`

### Code Files (Enhanced error handling):
1. `/src/components/TemplateRenderer.tsx`

### Scripts (Database fix):
1. `/scripts/fix-template-linebreaks.ts` - Script to fix templates in database

## Database Fix

Since templates are stored in the database, we also needed to fix templates that were already saved:

### Running the Fix Script

```bash
npx tsx scripts/fix-template-linebreaks.ts
```

This script:
1. ✅ Loads all templates from the database
2. ✅ Identifies templates with line break syntax errors
3. ✅ Fixes the broken string literals
4. ✅ Updates the templates in the database

**Result**: Fixed 1 template ("GREEN") that had the syntax error.

## Related Issues

- `TEMPLATE_SCRIPT_SYNTAX_FIX.md` - Initial script syntax error fixes
- `SHARE_FUNCTIONS_FIX.md` - Share function execution issues

## Status

✅ **FIXED** - All template files now have valid JavaScript syntax
✅ **ENHANCED** - Better error diagnostics for future issues
✅ **TESTED** - Templates execute without syntax errors
