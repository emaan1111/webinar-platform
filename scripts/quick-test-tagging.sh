#!/bin/bash

# Quick Test - Test ONE scenario at a time
# Usage: ./scripts/quick-test-tagging.sh [scenario_number]

API_BASE="http://localhost:3001"
WEBINAR_ID="cmhv6o0ps0005jwlgxig6b8qw"

echo "🧪 Quick Tagging Test"
echo "===================="
echo ""

# Test 1: Registration (should get UM-Webinar-Registered tag)
echo "TEST 1: Registration Only"
echo "Expected Tag: UM-Webinar-Registered"
echo ""

EMAIL="quick.test.$(date +%s)@example.com"

curl -X POST "${API_BASE}/api/webinars/${WEBINAR_ID}/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Quick Test User\",
    \"email\": \"${EMAIL}\",
    \"phone\": \"+1234567890\",
    \"timezone\": \"America/New_York\",
    \"country\": \"US\",
    \"privacyConsent\": true,
    \"marketingConsent\": true
  }" | jq '.'

echo ""
echo "✅ Registration complete!"
echo "📧 Email: ${EMAIL}"
echo ""
echo "🔍 Verify in ClickFunnels:"
echo "   1. Go to Contacts"
echo "   2. Search: ${EMAIL}"
echo "   3. Should have tag: UM-Webinar-Registered (ID: 368586)"
echo ""
