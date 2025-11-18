# Facebook API Timeout Issue - Diagnosis & Solutions

## Problem
Facebook Ads Charts API is timing out with `ETIMEDOUT` error after 25 seconds.

```
Error: AggregateError [ETIMEDOUT]
⏰ Facebook API timeout after 25 seconds
```

## Root Cause
The connection to Facebook's Graph API (`graph.facebook.com`) is not completing. This can be caused by:

### 1. Network Connectivity Issues
- Firewall blocking Facebook API
- ISP/corporate network restrictions
- VPN interfering with connections
- DNS resolution failures

### 2. Facebook API Token Issues
- Token expired (tokens expire after 60-90 days)
- Token permissions insufficient
- Token revoked in Facebook Business Manager

### 3. Facebook API Rate Limiting
- Too many requests in short time
- Account suspended or flagged
- Ad account restrictions

## Fixes Applied

### ✅ 1. Reduced Timeout (25s → 10s)
Fail faster to provide better user experience:
```typescript
const timeoutId = setTimeout(() => controller.abort(), 10000);
```

### ✅ 2. Graceful Degradation
Return empty metrics instead of failing completely:
```typescript
catch (fetchError) {
  if (fetchError.name === 'AbortError' || fetchError.code === 'ETIMEDOUT') {
    return NextResponse.json({
      success: true,
      metrics: [],
      warning: 'Facebook API timed out. Please check your network connection.'
    });
  }
}
```

### ✅ 3. Better Empty State Message
Frontend now shows helpful troubleshooting tips when no data is available.

## Solutions to Try

### Solution 1: Regenerate Facebook Access Token (Most Likely)

Your token may have expired. Generate a new one:

1. Go to **Facebook Business Manager**: https://business.facebook.com/settings/
2. Navigate to **System Users** or **Business Settings → System Users**
3. Select your system user (or create one)
4. Click **Generate New Token**
5. Select permissions:
   - ✅ `ads_read`
   - ✅ `ads_management` (if needed)
6. Copy the new token
7. Update `.env`:
   ```bash
   FB_ACCESS_TOKEN="EAA...new...token..."
   ```
8. Restart dev server:
   ```bash
   npm run dev
   ```

### Solution 2: Check Network Connectivity

Test if you can reach Facebook API:

```bash
# Test DNS resolution
nslookup graph.facebook.com

# Test ping (may be blocked)
ping graph.facebook.com

# Test HTTP connection
curl -I https://graph.facebook.com

# Test with your token
curl "https://graph.facebook.com/v22.0/me?access_token=YOUR_TOKEN"
```

### Solution 3: Check if VPN is Blocking

If you're using a VPN:
1. Try disconnecting VPN
2. Test charts page again
3. If it works, add Facebook domains to VPN whitelist:
   - `graph.facebook.com`
   - `*.facebook.com`
   - `*.fbcdn.net`

### Solution 4: Check Firewall/Corporate Network

If on corporate network:
1. Ask IT to whitelist Facebook API domains
2. Or work from personal network/home WiFi
3. Test using mobile hotspot to isolate issue

### Solution 5: Use Cached/Mock Data (Temporary Workaround)

For development, use mock data when API fails:

**File:** `/src/app/api/ads/charts/route.ts`

Add fallback data:
```typescript
catch (fetchError) {
  console.warn('Using mock data due to API timeout');
  
  // Generate mock data for date range
  const mockData = generateMockMetrics(from, to);
  
  return NextResponse.json({
    success: true,
    metrics: mockData,
    isMockData: true,
    warning: 'Using mock data - Facebook API unavailable'
  });
}
```

## Testing Steps

### 1. Test Token Validity
```bash
# Replace YOUR_TOKEN with your actual token
curl "https://graph.facebook.com/v22.0/me?access_token=YOUR_TOKEN"

# Should return:
{"name":"Your Business Name","id":"..."}

# If expired, returns:
{"error":{"message":"Invalid OAuth access token","type":"OAuthException"}}
```

### 2. Test Ad Account Access
```bash
curl "https://graph.facebook.com/v22.0/act_280500016006811/insights?access_token=YOUR_TOKEN"

# Should return data or permission error
```

### 3. Test Our API Endpoint
```bash
# Should return empty metrics with warning
curl "http://localhost:3000/api/ads/charts?from=2025-11-17&to=2025-11-18"
```

### 4. Check Browser
Navigate to:
```
http://localhost:3000/dashboard/ads/charts
```

Should show empty state with troubleshooting tips.

## Current Behavior

### Backend (API):
- ❌ Facebook API times out after 10 seconds
- ✅ Returns empty metrics array instead of 500 error
- ✅ Includes warning message
- ✅ Frontend doesn't crash

### Frontend (Charts Page):
- ✅ Shows loading spinner during fetch
- ✅ Shows helpful empty state with tips
- ✅ Provides "Retry" button
- ✅ Links to Overview tab as alternative

## Alternative: Use Overview Page

The **Overview** tab (`/dashboard/ads`) may still work because it:
- Uses aggregated metrics (faster)
- No time_increment=1 (simpler query)
- Shorter timeout acceptable

Try:
```
http://localhost:3000/dashboard/ads
```

## Recommended Action Plan

### Immediate (5 minutes):
1. ✅ Generate new Facebook access token
2. ✅ Update `.env` file
3. ✅ Restart dev server
4. ✅ Test charts page again

### Short-term (if still failing):
1. Test network connectivity to Facebook
2. Try different network (mobile hotspot)
3. Check Facebook Business Manager for account issues
4. Verify ad account permissions

### Long-term (for production):
1. Implement token refresh mechanism
2. Add caching layer (Redis)
3. Use background jobs for data fetching
4. Monitor token expiration
5. Set up alerts for API failures

## Files Modified

1. ✅ `/src/app/api/ads/charts/route.ts`
   - Reduced timeout to 10 seconds
   - Added graceful degradation
   - Returns empty array on timeout

2. ✅ `/src/app/dashboard/ads/charts/page.tsx`
   - Better empty state message
   - Troubleshooting tips
   - Retry button

## Expected Outcome

### After Token Refresh:
- Charts load in 3-5 seconds
- All data displays correctly
- No timeout errors

### If Still Timing Out:
- Empty state shows immediately (10s)
- Helpful error message displayed
- User can try Overview tab instead
- No application crash

---

**Status:** ⚠️  Facebook API Connectivity Issue  
**Impact:** Charts page shows empty state  
**Workaround:** Use Overview tab or regenerate token  
**Fix Time:** 5 minutes (token regeneration)
