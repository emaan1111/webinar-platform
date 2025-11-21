# Video Error Logging Enhancement - Complete ✅

## What Changed

Enhanced the video error logging system to track **user information** (name and email) alongside errors, providing better debugging capabilities for both **mobile and desktop** users.

## Features Added

### 1. **User-Level Error Attribution** 👤
- Track viewer name with each error
- Track viewer email with each error
- See exactly which users are experiencing issues

### 2. **Enhanced Console Logging** 🖨️
```
🚨 Logging video error: {
  errorType: 'timeout',
  device: '🖥️ Desktop',     // or '📱 Mobile'
  viewer: 'John Smith',
  message: 'Video failed to load within 30 seconds'
}
```

### 3. **Database Schema Update** 🗄️
Added two new columns to `video_error_logs` table:
- `viewer_name` (TEXT) - The user's full name
- `viewer_email` (TEXT) - The user's email address

### 4. **All Error Types Covered** 🎯
Enhanced logging for all 7 error scenarios:
- ⏱️ **timeout** - Video didn't load in 30 seconds
- 🖼️ **iframe_not_found** - Video iframe element missing from DOM
- 📦 **api_not_loaded** - Vimeo Player API failed to load
- ▶️ **play_failed** - Video play() call failed
- 🔧 **player_init_failed** - Player initialization error
- 🚫 **player_creation_failed** - Vimeo Player constructor failed
- 📜 **script_load_failed** - Vimeo script download failed

## Files Modified

### 1. `src/app/w/[slug]/live/page-client.tsx`
**Function Signature Update:**
```typescript
async function logVideoError(
  webinarId: string,
  registrationId: string | undefined,
  errorType: string,
  errorMessage: string,
  errorStack?: string,
  viewerInfo?: { name?: string; email?: string } // ✨ NEW
)
```

**All 7 Call Sites Updated:**
```typescript
// Example: Timeout error
await logVideoError(
  webinarId,
  registration?.id,
  'timeout',
  `Video failed to load within ${INIT_TIMEOUT / 1000} seconds`,
  undefined,
  { name: viewer?.name, email: viewer?.email } // ✨ NEW
);
```

**Enhanced Device Info:**
```typescript
const deviceInfo = {
  isMobile,
  isDesktop: !isMobile, // ✨ NEW - Explicit desktop tracking
  userAgent: navigator.userAgent,
  screenWidth: window.screen.width,
  screenHeight: window.screen.height,
  viewport: { width: window.innerWidth, height: window.innerHeight },
  timestamp: new Date().toISOString(),
};
```

### 2. `src/app/api/video-errors/route.ts`
**Enhanced Request Handling:**
```typescript
const {
  webinarId, registrationId, errorType, errorMessage,
  errorStack, errorContext, deviceInfo,
  viewerName, viewerEmail // ✨ NEW
} = await req.json();
```

**Enhanced Console Logging:**
```typescript
const parsedDeviceInfo = deviceInfo ? JSON.parse(deviceInfo) : null;
console.error('Video error logged:', {
  webinarId,
  errorType,
  device: parsedDeviceInfo?.isMobile ? '📱 Mobile' : '🖥️ Desktop', // ✨ NEW
  viewer: viewerName || 'Unknown', // ✨ NEW
  timestamp: new Date().toISOString()
});
```

**Updated Database Insert:**
```typescript
INSERT INTO video_error_logs (
  webinar_id, registration_id, error_type, error_message,
  error_stack, error_context, device_info,
  viewer_name, viewer_email, created_at // ✨ NEW COLUMNS
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
```

## Migration Required ⚠️

Run this SQL migration to add the new columns:

```sql
-- Add viewer info columns
ALTER TABLE video_error_logs
ADD COLUMN IF NOT EXISTS viewer_name TEXT,
ADD COLUMN IF NOT EXISTS viewer_email TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_video_error_logs_viewer_email 
  ON video_error_logs(viewer_email);

CREATE INDEX IF NOT EXISTS idx_video_error_logs_viewer_name 
  ON video_error_logs(viewer_name);
```

**Run the migration:**
```bash
# Connect to your database
psql $DATABASE_URL

# Or run the migration file
psql $DATABASE_URL -f add-viewer-info-to-video-errors.sql
```

## Benefits

### 1. **Better Debugging** 🔍
- Know exactly which users are having issues
- Contact affected users proactively
- Identify patterns by user

### 2. **Support Efficiency** 💬
- When users report issues, find their errors instantly
- Search by email: `SELECT * FROM video_error_logs WHERE viewer_email = 'user@example.com'`
- See complete error history per user

### 3. **Analytics** 📊
- Track error rates by user segment
- Identify users with chronic issues
- Measure video reliability per user

### 4. **Desktop Tracking** 🖥️
- Explicit `isDesktop` flag in deviceInfo
- Desktop errors now clearly distinguished
- Console logs show device type with emojis

## Testing

### Test Error Logging with User Info

1. **Join a webinar** with a registered user (has name and email)
2. **Force an error** (one of these methods):
   - Block Vimeo scripts in browser DevTools
   - Set a breakpoint to prevent video load
   - Corrupt the video iframe element
   - Disconnect network temporarily

3. **Check the logs:**
   ```sql
   SELECT 
     error_type,
     viewer_name,
     viewer_email,
     device_info::json->>'isDesktop' as is_desktop,
     error_message,
     created_at
   FROM video_error_logs
   ORDER BY created_at DESC
   LIMIT 10;
   ```

4. **Verify console output:**
   - Should see: `🚨 Logging video error:` with device emoji and viewer name
   - Desktop users: `🖥️ Desktop`
   - Mobile users: `📱 Mobile`

### Test All Error Types

Test each scenario:
- ⏱️ Timeout: Set very short timeout, use slow connection
- 🖼️ Iframe not found: Delete iframe with DevTools
- 📦 API not loaded: Block Vimeo API script
- ▶️ Play failed: Pause before auto-play attempts
- 🔧 Init failed: Corrupt video ID
- 🚫 Creation failed: Pass invalid options to Vimeo Player
- 📜 Script load failed: Block player.vimeo.com domain

## Query Examples

### Find all errors for a specific user:
```sql
SELECT * FROM video_error_logs
WHERE viewer_email = 'user@example.com'
ORDER BY created_at DESC;
```

### Count errors by user:
```sql
SELECT 
  viewer_name,
  viewer_email,
  COUNT(*) as error_count,
  array_agg(DISTINCT error_type) as error_types
FROM video_error_logs
WHERE viewer_email IS NOT NULL
GROUP BY viewer_name, viewer_email
ORDER BY error_count DESC
LIMIT 20;
```

### Desktop vs Mobile error rates:
```sql
SELECT 
  device_info::json->>'isDesktop' as is_desktop,
  COUNT(*) as error_count,
  error_type
FROM video_error_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY device_info::json->>'isDesktop', error_type
ORDER BY error_count DESC;
```

### Users with multiple errors:
```sql
SELECT 
  viewer_email,
  viewer_name,
  COUNT(*) as error_count,
  MAX(created_at) as last_error,
  array_agg(error_type ORDER BY created_at DESC) as error_sequence
FROM video_error_logs
WHERE viewer_email IS NOT NULL
GROUP BY viewer_email, viewer_name
HAVING COUNT(*) > 3
ORDER BY error_count DESC;
```

## Summary

✅ **Enhanced Logging Function** - Now accepts viewer info parameter  
✅ **Updated All Call Sites** - All 7 error types pass viewer data  
✅ **Modified API Endpoint** - Accepts and stores viewer name/email  
✅ **Enhanced Console Output** - Shows device type and viewer name  
✅ **Database Schema** - New columns for viewer_name and viewer_email  
✅ **Comprehensive Coverage** - Both mobile and desktop errors tracked  
✅ **Migration Ready** - SQL script provided for schema update

🎯 **Result:** You can now track exactly which users are experiencing video errors, contact them proactively, and debug issues with full user context!
