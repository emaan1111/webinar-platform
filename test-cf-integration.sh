#!/bin/bash

# Test ClickFunnels Integration
# This script starts the server, runs the test, and cleans up

cd "/Volumes/WD/CODE/Webinar Play 2"

echo "🚀 Starting development server..."
npm run dev > server.log 2>&1 &
SERVER_PID=$!
echo "   Server PID: $SERVER_PID"

# Wait for server to be ready
echo "⏳ Waiting for server to start..."
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Server is ready!"
        break
    fi
    sleep 1
    echo "   Checking... ($i/30)"
done

echo ""
echo "🧪 Running ClickFunnels Integration Test..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Run the test
node test-clickfunnels.js

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⏳ Waiting for async ClickFunnels sync to complete..."
sleep 5
echo ""
echo "📋 Server logs for ClickFunnels sync:"
echo ""
grep -E "(ClickFunnels|Sending contact|Contact sent|Failed|Error|❌|✅|Response Status|API URL)" server.log | tail -30
echo ""
echo "🛑 Stopping server..."
sleep 2
kill $SERVER_PID 2>/dev/null
sleep 1
echo ""
echo "📄 Full relevant logs saved to: cf-test-logs.txt"
grep -E "(ClickFunnels|Sending contact|Contact sent|Failed|Error)" server.log > cf-test-logs.txt 2>/dev/null
rm -f server.log

echo "✅ Test complete!"
