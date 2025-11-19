# Embed CORS Configuration - Complete ✅

## Overview

All embed-related API endpoints now have proper CORS (Cross-Origin Resource Sharing) headers configured to allow embedding on any external website without CORS issues.

## CORS Configuration

### Endpoints Updated

1. **`/api/embed/[id]`** - Main embed script
2. **`/api/embed/[id]/preview`** - Preview page
3. **`/api/webinars/[id]/register`** - Registration endpoint

### CORS Headers Applied

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',           // Allow from any domain
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',            // Cache preflight for 24 hours
}
```

## Technical Details

### 1. Preflight Requests (OPTIONS)

All endpoints now handle OPTIONS preflight requests that browsers send before making cross-origin POST requests:

```typescript
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  })
}
```

### 2. Response Headers

All responses (success and error) include CORS headers:

```typescript
// Success response
return NextResponse.json(data, {
  status: 200,
  headers: corsHeaders
})

// Error response
return NextResponse.json({ error: 'Message' }, {
  status: 400,
  headers: corsHeaders
})
```

## Why This Matters

### Without CORS Headers ❌

When embedding on external websites:
- Browser blocks the POST request to `/api/webinars/[id]/register`
- Registration form fails silently
- Console error: "CORS policy: No 'Access-Control-Allow-Origin' header"
- No registrations from embedded forms

### With CORS Headers ✅

- Browser allows cross-origin requests
- Registration form works perfectly
- Data is submitted successfully
- Users can register from any website

## Testing Scenarios

### Scenario 1: Popup Embed
```html
<!-- On customer's website: https://example.com -->
<button data-webinar-popup="webinar-id">Register</button>
<script src="https://your-app.railway.app/api/embed/webinar-id?type=popup&theme=purple"></script>
```

**Flow:**
1. ✅ Browser loads embed script (CORS: allowed)
2. ✅ User clicks button, popup opens
3. ✅ User fills form and submits
4. ✅ Browser sends OPTIONS preflight to `/api/webinars/[id]/register`
5. ✅ Server responds with CORS headers
6. ✅ Browser sends POST request with form data
7. ✅ Registration succeeds, confirmation shown

### Scenario 2: Inline Embed
```html
<!-- On customer's website: https://example.com -->
<div id="webinar-embed-webinar-id"></div>
<script src="https://your-app.railway.app/api/embed/webinar-id?type=inline&theme=blue"></script>
```

**Flow:**
1. ✅ Browser loads embed script (CORS: allowed)
2. ✅ Form renders in the div
3. ✅ User fills form and submits
4. ✅ Browser sends OPTIONS preflight
5. ✅ Server responds with CORS headers
6. ✅ Browser sends POST request
7. ✅ Registration succeeds

## Security Considerations

### Why `Access-Control-Allow-Origin: *`?

We use wildcard (`*`) because:
- ✅ Embeds are meant to be used on ANY customer website
- ✅ Registration endpoint is public (no authentication required)
- ✅ No sensitive data is exposed
- ✅ Rate limiting and validation protect against abuse

### What's Protected

Even with CORS enabled:
- ❌ Cannot access dashboard endpoints (require authentication)
- ❌ Cannot modify existing data (only create registrations)
- ❌ Cannot access other users' data
- ❌ Rate limited to prevent abuse

## Browser Compatibility

### Modern Browsers ✅
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Opera: Full support

### How Browsers Handle CORS

1. **Simple Requests (GET)**
   - Browser sends request directly
   - Checks CORS headers in response

2. **Preflight Requests (POST with JSON)**
   - Browser sends OPTIONS request first
   - Checks if server allows the actual request
   - Sends actual request if approved

## Common Issues & Solutions

### Issue 1: "CORS policy" error
**Cause:** Missing CORS headers
**Solution:** ✅ Fixed - all endpoints have CORS headers

### Issue 2: OPTIONS request failing
**Cause:** No OPTIONS handler
**Solution:** ✅ Fixed - OPTIONS handlers added

### Issue 3: Error responses blocked
**Cause:** Error responses missing CORS headers
**Solution:** ✅ Fixed - all responses include headers

### Issue 4: Cached preflight issues
**Cause:** Browser caching old preflight responses
**Solution:** ✅ Fixed - `Access-Control-Max-Age: 86400` for consistent caching

## Testing CORS

### Using curl

```bash
# Test OPTIONS preflight
curl -X OPTIONS \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -i \
  https://your-app.railway.app/api/webinars/[id]/register

# Expected: 204 with CORS headers

# Test actual POST
curl -X POST \
  -H "Origin: https://example.com" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","privacyConsent":true}' \
  -i \
  https://your-app.railway.app/api/webinars/[id]/register

# Expected: 201 with CORS headers
```

### Using Browser Console

```javascript
// Test from any website's console
fetch('https://your-app.railway.app/api/webinars/[id]/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Test User',
    email: 'test@example.com',
    privacyConsent: true
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

## Implementation Summary

### Files Modified

1. **`src/app/api/embed/[id]/route.ts`**
   - Added OPTIONS handler
   - Added CORS headers to all responses
   - Fixed error responses

2. **`src/app/api/embed/[id]/preview/route.ts`**
   - Added OPTIONS handler
   - Added CORS headers to all responses

3. **`src/app/api/webinars/[id]/register/route.ts`**
   - Added OPTIONS handler
   - Added CORS headers to all responses (success and errors)
   - Critical for form submissions

### Code Pattern

```typescript
// At top of file
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
}

// OPTIONS handler
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  })
}

// In responses
return NextResponse.json(data, {
  status: 200,
  headers: corsHeaders
})
```

## Production Checklist

- [x] CORS headers added to embed script endpoint
- [x] CORS headers added to preview endpoint
- [x] CORS headers added to registration endpoint
- [x] OPTIONS handlers implemented for all POST endpoints
- [x] Error responses include CORS headers
- [x] Success responses include CORS headers
- [x] Tested with different origins
- [x] Browser console shows no CORS errors
- [x] Form submissions work from external sites

## Monitoring

### What to Watch

1. **Browser Console**
   - Should see no CORS errors
   - Network tab shows 204 OPTIONS responses

2. **Server Logs**
   - OPTIONS requests logged
   - Registration requests succeeding

3. **Analytics**
   - Track embed conversion rates
   - Monitor registration success rate
   - Watch for unusual patterns

## Future Enhancements

### Optional Improvements

1. **Origin Whitelist** (if needed)
   ```typescript
   const allowedOrigins = ['https://example.com', 'https://partner.com']
   const origin = request.headers.get('origin')
   const corsHeaders = {
     'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : '*'
   }
   ```

2. **Rate Limiting by Origin**
   - Track requests per origin
   - Throttle abusive domains

3. **Analytics by Origin**
   - Track which websites generate most registrations
   - Optimize for high-performing embeds

## Conclusion

✅ **All embed endpoints are now CORS-ready**

Your webinar registration embeds will work perfectly on any external website without CORS issues. The implementation follows web standards and best practices for public APIs.

Users can now:
- Embed registration forms on their websites
- Submit registrations without errors
- Use both popup and inline modes
- Customize themes and styling
- Track conversions across domains

---

**Last Updated:** November 20, 2025
**Status:** Complete and Production Ready
