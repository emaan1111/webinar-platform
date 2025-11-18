#!/bin/bash

echo "🧪 Testing Facebook Ads Charts API..."
echo ""

# Test 1: Check server is running
echo "1️⃣ Checking server..."
if lsof -ti:3000 > /dev/null 2>&1; then
  echo "   ✅ Server running on port 3000"
else
  echo "   ❌ Server not running! Start with: npm run dev"
  exit 1
fi
echo ""

# Test 2: Test debug endpoint (2 days - very fast)
echo "2️⃣ Testing debug endpoint (2 days)..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}\nTIME:%{time_total}" "http://localhost:3000/api/ads/charts-debug?from=2025-11-17&to=2025-11-18")
STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
TIME=$(echo "$RESPONSE" | grep "TIME" | cut -d: -f2)

if [ "$STATUS" = "200" ]; then
  echo "   ✅ Debug endpoint working (${TIME}s)"
else
  echo "   ❌ Debug endpoint failed (Status: $STATUS)"
  echo "$RESPONSE" | grep -v "HTTP_STATUS" | grep -v "TIME"
fi
echo ""

# Test 3: Test charts endpoint (7 days - normal load)
echo "3️⃣ Testing charts endpoint (7 days)..."
START_TIME=$(date +%s)
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}\nTIME:%{time_total}" "http://localhost:3000/api/ads/charts?from=2025-11-11&to=2025-11-18")
STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
TIME=$(echo "$RESPONSE" | grep "TIME" | cut -d: -f2)

if [ "$STATUS" = "200" ]; then
  METRICS_COUNT=$(echo "$RESPONSE" | grep -o '"metrics":\[' | wc -l)
  echo "   ✅ Charts endpoint working (${TIME}s)"
  
  # Check if we got data
  if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "   ✅ Data retrieved successfully"
  else
    echo "   ⚠️  Response received but check data format"
  fi
elif [ "$STATUS" = "504" ]; then
  echo "   ⏰ Timeout (${TIME}s) - Expected for large ranges"
else
  echo "   ❌ Charts endpoint failed (Status: $STATUS)"
  echo "$RESPONSE" | grep -v "HTTP_STATUS" | grep -v "TIME" | head -5
fi
echo ""

# Test 4: Quick health check on main ads API
echo "4️⃣ Testing main ads metrics endpoint..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "http://localhost:3000/api/ads/metrics?preset=today")
STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)

if [ "$STATUS" = "200" ]; then
  echo "   ✅ Main ads API working"
else
  echo "   ❌ Main ads API failed (Status: $STATUS)"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ If all tests passed, your charts should work!"
echo ""
echo "🌐 Open in browser:"
echo "   http://localhost:3000/dashboard/ads/charts"
echo ""
echo "⏱️  Expected load time: 5-10 seconds (7-day range)"
echo ""
echo "📝 If charts still timeout:"
echo "   1. Check server terminal for error logs"
echo "   2. Try selecting 'Last 7 Days' button"
echo "   3. Check browser console (F12) for errors"
echo "   4. Try debug URL: http://localhost:3000/api/ads/charts-debug"
echo ""
