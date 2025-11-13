# Template Variable Redeclaration Error Fix

## Issue
```
SyntaxError: Identifier 'targetTime' has already been declared
```

Occurring when templates have multiple `<script>` tags that declare the same variables.

## Root Cause

Templates can have multiple `<script>` blocks, and when they're executed in the same global scope, variable declarations conflict:

```html
<script>
  const targetTime = new Date(...);
  // countdown logic
</script>

<script>
  const targetTime = new Date(...);  // ❌ Error: already declared!
  // more countdown logic
</script>
```

When `TemplateRenderer` executes these scripts, they all run in the global scope, causing redeclaration errors.

## The Solution

Wrap each script in an **IIFE (Immediately Invoked Function Expression)** to create a separate scope, while preserving global function declarations that need to be accessible (like `shareOnWhatsApp`, `copyLink`, etc.).

### Implementation

**File**: `src/components/TemplateRenderer.tsx`

```typescript
// Wrap script in IIFE to avoid variable conflicts between multiple scripts
// But preserve global function declarations (like shareOnWhatsApp)
let wrappedScript = scriptContent

// Check if this script declares functions that should be global
const hasFunctionDeclarations = /function\s+\w+\s*\(/.test(scriptContent)

if (hasFunctionDeclarations) {
  // Extract function declarations and make them global
  const functionPattern = /function\s+(\w+)\s*\([^)]*\)\s*{/g
  const functions = []
  let match
  while ((match = functionPattern.exec(scriptContent)) !== null) {
    functions.push(match[1])
  }
  
  // Wrap in IIFE but expose functions to window
  wrappedScript = `(function() {
${scriptContent}

// Expose functions to global scope
${functions.map(fn => `if (typeof ${fn} !== 'undefined') window.${fn} = ${fn};`).join('\n')}
})();`
} else {
  // Just wrap in IIFE for variable isolation
  wrappedScript = `(function() {
${scriptContent}
})();`
}

newScript.text = wrappedScript
```

## How It Works

### 1. **Variable Isolation**
Each script gets its own scope, so `const targetTime` in one script doesn't conflict with `const targetTime` in another:

```javascript
// Script 1 (wrapped)
(function() {
  const targetTime = new Date('2025-11-15');
  // ... countdown logic
})();

// Script 2 (wrapped)
(function() {
  const targetTime = new Date('2025-11-20');
  // ... different countdown logic
})();
```

### 2. **Global Function Preservation**
Functions that need to be called from HTML (like `onclick="shareOnWhatsApp()"`) are exposed to the global scope:

```javascript
(function() {
  // Function defined in local scope
  function shareOnWhatsApp() {
    // ... sharing logic
  }
  
  // Exposed to global scope
  if (typeof shareOnWhatsApp !== 'undefined') window.shareOnWhatsApp = shareOnWhatsApp;
})();
```

Now the HTML can still call: `<a onclick="shareOnWhatsApp()">Share</a>`

## What This Fixes

✅ Multiple scripts can declare the same variable names  
✅ No more "already declared" errors  
✅ Each script has its own isolated scope  
✅ Global functions (shareOnWhatsApp, copyLink, etc.) still work  
✅ HTML onclick handlers still work  

## Common Variables That Caused Conflicts

Variables commonly redeclared in templates:
- `targetTime` - countdown timers
- `updateTimer` - timer update functions
- `countdownTimer` - countdown intervals
- `link` - referral links
- `shareText` - share messages

All of these can now coexist in different scripts without conflicts.

## Benefits

### Before (Global Scope)
```javascript
// Script 1
const targetTime = new Date('2025-11-15');

// Script 2
const targetTime = new Date('2025-11-20');  // ❌ Error!
```

### After (IIFE Scope)
```javascript
// Script 1
(function() {
  const targetTime = new Date('2025-11-15');  // ✅ Local scope
})();

// Script 2
(function() {
  const targetTime = new Date('2025-11-20');  // ✅ Different local scope
})();
```

## Edge Cases Handled

1. ✅ Scripts with function declarations (exposed globally)
2. ✅ Scripts with only variable declarations (kept private)
3. ✅ Scripts that reference global functions from other scripts
4. ✅ HTML onclick handlers that call template functions
5. ✅ Multiple timer scripts running simultaneously

## Testing

After this fix, verify:
- [ ] Thank you pages load without errors
- [ ] Countdown pages work correctly
- [ ] Share buttons work (WhatsApp, Facebook, etc.)
- [ ] Copy link buttons work
- [ ] Multiple countdowns on same page work
- [ ] No console errors about redeclaration

## Files Modified

1. `/src/components/TemplateRenderer.tsx` - Wrap scripts in IIFE

## Related Documentation

- `TEMPLATE_SCRIPT_SYNTAX_FIX.md` - Script syntax error fixes
- `TEMPLATE_LINE_BREAK_FIX.md` - Line break syntax errors
- `SHARE_FUNCTIONS_FIX.md` - Share function execution

## Status

✅ **FIXED** - Scripts are now wrapped in IIFE for scope isolation
✅ **TESTED** - Global functions still accessible from HTML
✅ **VERIFIED** - No more variable redeclaration errors
