# Embed Troubleshooting Guide

## Issue: Embed preview shows "Loading registration form..." but nothing appears

### Diagnosis Steps:

1. **Check if webinar exists**: The embed endpoint requires a valid webinar ID
   ```bash
   # Test with a real webinar ID from your database
   curl https://emaanpowerclasses.com/api/embed/YOUR-WEBINAR-ID?type=inline&theme=purple
   ```

2. **Check browser console**: Open the embed preview and look for:
   - JavaScript errors
   - Network request failures
   - CORS errors

3. **Verify the script loads**: In the browser console:
   ```javascript
   // Check if the embed script loaded
   console.log('Script loaded:', !!window.WEBINAR_DATA);
   ```

### Common Causes:

1. **Invalid Webinar ID**: The webinar doesn't exist in the database
   - Solution: Use a valid webinar ID from your webinars list

2. **Script not generating**: TypeScript compilation issue
   - Check: `npm run build` for errors

3. **JavaScript errors in embed script**: Syntax or runtime errors
   - Check browser console for errors

4. **Container not found**: The embed container ID doesn't match
   - Check: `<div id="webinar-embed-{YOUR-ID}"></div>` exists

### Quick Test:

1. Go to Dashboard → Webinars
2. Copy a webinar ID from the list
3. Test the embed URL directly:
   ```
   https://emaanpowerclasses.com/api/embed/[WEBINAR-ID]?type=inline&theme=purple
   ```
4. You should see JavaScript code, not an error

### If Script Returns JavaScript:

The embed script should start with:
```javascript
(function() {
  'use strict';
  
  const WEBINAR_DATA = {
    id: "...",
    title: "...",
    ...
  };
  ...
})();
```

If you see this, the script is working. The issue is likely in the initialization.

### If Script Returns Error:

- Check webinar exists in database
- Check server logs for errors
- Verify database connection

