# Testing Comprehensive Error Logging

## Quick Test (5 minutes)

### Test 1: Network Offline ⚡
**Simulate:** User loses internet connection

```bash
# On mobile/desktop:
1. Start video playback
2. Open DevTools → Network tab (F12)
3. Click "Throttling" → Select "Offline"
4. Wait 2 seconds
5. Check console - should see:
   "🚨 Network connection lost"
6. Click "Throttling" → Select "No throttling"
7. Should see: "🌐 Network connection restored"
```

**Expected Database Entry:**
```sql
SELECT * FROM video_error_logs 
WHERE error_type = 'network_offline' 
ORDER BY created_at DESC LIMIT 1;

-- Should show:
-- error_type: network_offline
-- viewer_name: [Your name]
-- viewer_email: [Your email]
-- error_message: "Network connection lost while video was playing"
```

### Test 2: Block Vimeo (Content Blocker) 🚫
**Simulate:** Corporate firewall or ad blocker

```bash
# Method 1: Browser Extension
1. Install uBlock Origin or similar
2. Add filter: ||player.vimeo.com^
3. Reload page
4. Try to start video
5. Check console for "🚨 Iframe failed to load"

# Method 2: DevTools
1. Open DevTools → Network tab
2. Right-click on player.vimeo.com request
3. Select "Block request URL"
4. Reload page
5. Try to start video
```

**Expected Database Entry:**
```sql
SELECT * FROM video_error_logs 
WHERE error_type = 'iframe_load_error' 
ORDER BY created_at DESC LIMIT 1;

-- Should show:
-- error_type: iframe_load_error
-- error_message: "Vimeo iframe failed to load - possible network issue or blocked content"
```

### Test 3: JavaScript Error 💥
**Simulate:** Unexpected browser error

```bash
# In browser console:
1. Start video
2. Wait for it to load
3. In console, type:
   throw new Error('Test video error in Vimeo player');
4. Press Enter
5. Check console for "🚨 Global error (video-related)"
```

**Expected Database Entry:**
```sql
SELECT * FROM video_error_logs 
WHERE error_type = 'uncaught_error' 
ORDER BY created_at DESC LIMIT 1;

-- Should show:
-- error_type: uncaught_error
-- error_message: Contains "Test video error"
-- error_stack: Full stack trace
```

### Test 4: Promise Rejection ⚠️
**Simulate:** Async operation failure

```bash
# In browser console:
1. Type:
   Promise.reject(new Error('Vimeo player failed'));
2. Press Enter
3. Check console for "🚨 Unhandled promise rejection"
```

**Expected Database Entry:**
```sql
SELECT * FROM video_error_logs 
WHERE error_type = 'unhandled_rejection' 
ORDER BY created_at DESC LIMIT 1;

-- Should show:
-- error_type: unhandled_rejection
-- error_message: "Promise rejected: Vimeo player failed"
```

## Comprehensive Test Suite

### Mobile-Specific Tests 📱

#### Test 5: Low Memory
1. Open many browser tabs (15+)
2. Try to start video
3. Check if any errors logged

#### Test 6: Slow Connection
1. DevTools → Network → Slow 3G
2. Try to start video
3. Should log timeout after 60s

#### Test 7: Battery Saver Mode
1. Enable low power mode (iOS/Android)
2. Try to start video
3. Monitor for any errors

### Desktop-Specific Tests 🖥️

#### Test 8: CORS Issues
1. Open DevTools → Console
2. Look for CORS errors
3. Should be logged as `uncaught_error`

#### Test 9: Extension Conflicts
1. Install aggressive ad blocker
2. Try to start video
3. Check for blocked resources

### Edge Cases 🧪

#### Test 10: Rapid Tab Switching
1. Start video
2. Switch tabs rapidly (10 times)
3. Return to video tab
4. Check for errors

#### Test 11: Browser Permissions
1. Deny autoplay permission
2. Try to start video
3. Should log play_failed

#### Test 12: Incognito Mode
1. Open webinar in incognito
2. Try to start video
3. All errors should still log

## Verification Queries

### See All Recent Errors
```sql
SELECT 
  error_type,
  viewer_name,
  viewer_email,
  LEFT(error_message, 100) as message,
  device_info::json->>'isMobile' as is_mobile,
  created_at
FROM video_error_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

### Error Count by Type
```sql
SELECT 
  error_type,
  COUNT(*) as count,
  array_agg(DISTINCT viewer_email) as affected_users
FROM video_error_logs
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY error_type
ORDER BY count DESC;
```

### Mobile vs Desktop Errors
```sql
SELECT 
  CASE 
    WHEN device_info::json->>'isMobile' = 'true' THEN 'Mobile'
    ELSE 'Desktop'
  END as device,
  error_type,
  COUNT(*) as count
FROM video_error_logs
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY device, error_type
ORDER BY count DESC;
```

### Find Users with Multiple Errors
```sql
SELECT 
  viewer_email,
  viewer_name,
  COUNT(*) as error_count,
  array_agg(DISTINCT error_type) as error_types,
  MAX(created_at) as last_error
FROM video_error_logs
WHERE viewer_email IS NOT NULL
GROUP BY viewer_email, viewer_name
HAVING COUNT(*) > 2
ORDER BY error_count DESC;
```

## Console Output Examples

### ✅ Good - Error Caught and Logged
```
🚨 Global error (video-related): {
  message: "Cannot read property 'play' of undefined",
  filename: "https://player.vimeo.com/api/player.js",
  lineno: 142,
  colno: 23
}

🚨 Logging video error: {
  errorType: 'uncaught_error',
  device: 'Mobile',
  viewer: 'Test User',
  message: "Cannot read property 'play' of undefined..."
}
```

### ✅ Good - Network Issue Detected
```
🚨 Network connection lost

🚨 Logging video error: {
  errorType: 'network_offline',
  device: 'Desktop',
  viewer: 'Test User',
  message: "Network connection lost while video was playing"
}
```

### ✅ Good - Iframe Blocked
```
🚨 Iframe failed to load: Event {...}

🚨 Logging video error: {
  errorType: 'iframe_load_error',
  device: 'Mobile',
  viewer: 'Test User',
  message: "Vimeo iframe failed to load - possible network issue or blocked content"
}
```

### ❌ Bad - No Errors (Everything Working)
```
🎯 Starting player initialization process...
📱 Mobile device detected: true
✅ Vimeo Player instance created
✅ Player ready
🔇 Setting muted=true for autoplay compliance...
✅ Video muted successfully
✅ Time set to: 0s
🎮 Attempting to play video (muted)...
🎉 Video playing successfully!
```

## Error Type Reference

| Error Type | Meaning | User Action |
|---|---|---|
| `uncaught_error` | JavaScript error in video code | Check console, report if recurring |
| `unhandled_rejection` | Promise failed | Network or async issue |
| `iframe_load_error` | Vimeo iframe blocked | Disable ad blocker, check firewall |
| `network_offline` | Internet disconnected | Check WiFi/data connection |
| `timeout` | Video too slow to load | Check connection speed |
| `script_load_failed` | Vimeo SDK blocked | Whitelist player.vimeo.com |
| `play_failed` | Browser blocked playback | Check autoplay settings |

## Success Criteria

After testing, you should have:
- ✅ At least 1 entry for each error type in database
- ✅ All entries have `viewer_name` and `viewer_email`
- ✅ Console shows clear error messages with emojis
- ✅ Device info correctly shows Mobile/Desktop
- ✅ Stack traces captured where available
- ✅ No TypeScript or runtime errors in console
- ✅ Normal video playback unaffected

## Cleanup After Testing

Remove test errors from database:
```sql
-- Delete errors from last hour (your test period)
DELETE FROM video_error_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
  AND viewer_email = 'your-test-email@example.com';

-- Or just view them for reporting
SELECT * FROM video_error_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

## Production Monitoring

Once deployed, monitor these queries:

### Daily Error Summary
```sql
-- Run daily to see error trends
SELECT 
  DATE(created_at) as date,
  error_type,
  COUNT(*) as count,
  COUNT(DISTINCT viewer_email) as unique_users
FROM video_error_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at), error_type
ORDER BY date DESC, count DESC;
```

### Alert Conditions
Set up alerts for:
- More than 10 errors of same type in 1 hour
- Any user with 3+ errors
- `network_offline` spike (possible ISP issue)
- `iframe_load_error` spike (possible Vimeo outage)

## Support Workflow

When user reports "video not working":

1. **Query their errors:**
```sql
SELECT * FROM video_error_logs
WHERE viewer_email = 'user@example.com'
ORDER BY created_at DESC
LIMIT 10;
```

2. **Identify issue from error_type:**
- `network_offline` → "Check your internet connection"
- `iframe_load_error` → "Disable ad blocker or check firewall"
- `play_failed` → "Enable autoplay in browser settings"
- `timeout` → "Try refreshing or use faster connection"

3. **Share device info for debugging:**
```sql
SELECT device_info FROM video_error_logs
WHERE viewer_email = 'user@example.com'
LIMIT 1;
```

Happy testing! 🧪🎉
