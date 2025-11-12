#!/usr/bin/env node

/**
 * Comprehensive Test Suite for ClickFunnels Attendance Tagging
 * Tests all 6 tag scenarios
 */

const API_BASE = 'http://localhost:3001';
const WEBINAR_ID = 'cmhv6o0ps0005jwlgxig6b8qw';

// Test scenarios
const SCENARIOS = [
  {
    name: 'Scenario 1: Perfect Attendee (MostlyAttended)',
    description: 'User watches until offer/CTA (last 15 mins)',
    webinarDuration: 3600, // 60 minutes
    watchTime: 3300, // 55 minutes
    videoPosition: 3300,
    expectedTags: ['Attended', 'MostlyAttended']
  },
  {
    name: 'Scenario 2: Partial Attendee (PartlyAttended)',
    description: 'User watches 40+ minutes but leaves before offer',
    webinarDuration: 3600, // 60 minutes
    watchTime: 2700, // 45 minutes
    videoPosition: 2700,
    expectedTags: ['Attended', 'PartlyAttended']
  },
  {
    name: 'Scenario 3: Early Leaver',
    description: 'User watches less than 40 minutes',
    webinarDuration: 3600, // 60 minutes
    watchTime: 1800, // 30 minutes
    videoPosition: 1800,
    expectedTags: ['Attended']
  },
  {
    name: 'Scenario 4: Quick Exit',
    description: 'User joins but leaves within 10 minutes',
    webinarDuration: 3600, // 60 minutes
    watchTime: 600, // 10 minutes
    videoPosition: 600,
    expectedTags: ['Attended']
  },
  {
    name: 'Scenario 5: No Show',
    description: 'User registers but never attends',
    webinarDuration: 3600, // 60 minutes
    watchTime: 0, // 0 minutes
    videoPosition: 0,
    expectedTags: ['Missed']
  },
  {
    name: 'Scenario 6: Replay Viewer (Full)',
    description: 'User watches replay until offer',
    webinarDuration: 3600, // 60 minutes
    watchTime: 3300, // 55 minutes
    videoPosition: 3300,
    isReplay: true,
    expectedTags: ['Attended', 'ReplayAttended', 'MostlyAttended']
  },
  {
    name: 'Scenario 7: Replay Viewer (Partial)',
    description: 'User watches partial replay',
    webinarDuration: 3600, // 60 minutes
    watchTime: 2400, // 40 minutes
    videoPosition: 2400,
    isReplay: true,
    expectedTags: ['Attended', 'ReplayAttended', 'PartlyAttended']
  }
];

// Simulated tag determination (matches the actual logic)
function determineAttendanceTags(data) {
  const { webinarDuration, watchTime, attended, isReplay, reachedOfferCTA } = data;
  const tags = [];

  if (!attended || watchTime === 0) {
    tags.push('Missed');
    return tags;
  }

  tags.push('Attended');

  if (isReplay) {
    tags.push('ReplayAttended');
  }

  const watchMinutes = Math.floor(watchTime / 60);

  if (reachedOfferCTA) {
    tags.push('MostlyAttended');
  } else if (watchMinutes >= 40) {
    tags.push('PartlyAttended');
  }

  return tags;
}

async function testScenario(scenario, index) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`TEST ${index + 1}: ${scenario.name}`);
  console.log(`${'='.repeat(70)}`);
  console.log(`📝 ${scenario.description}`);
  console.log(`\n⏱️  Test Parameters:`);
  console.log(`   Webinar Duration: ${scenario.webinarDuration / 60} minutes`);
  console.log(`   Watch Time: ${scenario.watchTime / 60} minutes`);
  console.log(`   Video Position: ${scenario.videoPosition / 60} minutes`);
  console.log(`   Is Replay: ${scenario.isReplay || false}`);
  
  const offerCTAThreshold = scenario.webinarDuration - 900; // Last 15 mins
  const reachedOfferCTA = scenario.videoPosition >= offerCTAThreshold;
  
  console.log(`   Offer CTA Threshold: ${offerCTAThreshold / 60} minutes`);
  console.log(`   Reached Offer CTA: ${reachedOfferCTA ? '✅ Yes' : '❌ No'}`);

  // Step 1: Register user
  console.log(`\n📋 Step 1: Registering user...`);
  const email = `test.scenario${index + 1}.${Date.now()}@example.com`;
  const registrationData = {
    name: `Test User Scenario ${index + 1}`,
    email,
    phone: '+1234567890',
    timezone: 'America/New_York',
    country: 'US',
    privacyConsent: true,
    marketingConsent: true
  };

  try {
    const regResponse = await fetch(`${API_BASE}/api/webinars/${WEBINAR_ID}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registrationData)
    });

    if (!regResponse.ok) {
      console.error(`   ❌ Registration failed: ${regResponse.status}`);
      return false;
    }

    const regResult = await regResponse.json();
    const registrationId = regResult.registrationId;
    console.log(`   ✅ Registered with ID: ${registrationId}`);
    console.log(`   📧 Email: ${email}`);
    console.log(`   🏷️  Expected Tag: UM-Webinar-Registered`);

    // Step 2: Join webinar (if attended)
    if (scenario.watchTime > 0) {
      console.log(`\n📋 Step 2: Joining webinar...`);
      
      const joinResponse = await fetch(`${API_BASE}/api/tracking/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId,
          webinarId: WEBINAR_ID,
          action: 'join',
          userAgent: 'Mozilla/5.0 (Test)',
          device: 'desktop'
        })
      });

      if (!joinResponse.ok) {
        console.error(`   ❌ Join failed: ${joinResponse.status}`);
        return false;
      }

      const joinResult = await joinResponse.json();
      console.log(`   ✅ Session started: ${joinResult.sessionId}`);

      // Step 3: Simulate watching
      console.log(`\n📋 Step 3: Simulating watch time (${scenario.watchTime / 60} mins)...`);
      
      const updateResponse = await fetch(`${API_BASE}/api/tracking/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId,
          webinarId: WEBINAR_ID,
          action: 'update',
          watchTime: scenario.watchTime,
          videoPosition: scenario.videoPosition
        })
      });

      if (!updateResponse.ok) {
        console.error(`   ❌ Update failed: ${updateResponse.status}`);
        return false;
      }

      console.log(`   ✅ Watch progress updated`);

      // Step 4: Leave webinar
      console.log(`\n📋 Step 4: Leaving webinar...`);
      
      const leaveResponse = await fetch(`${API_BASE}/api/tracking/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId,
          webinarId: WEBINAR_ID,
          action: 'leave',
          watchTime: scenario.watchTime,
          videoPosition: scenario.videoPosition
        })
      });

      if (!leaveResponse.ok) {
        console.error(`   ❌ Leave failed: ${leaveResponse.status}`);
        return false;
      }

      console.log(`   ✅ Session ended`);
    } else {
      console.log(`\n📋 Step 2-4: Skipped (No-Show scenario)`);
    }

    // Step 5: Calculate expected tags
    console.log(`\n📋 Step 5: Tag Calculation`);
    const expectedTags = determineAttendanceTags({
      webinarDuration: scenario.webinarDuration,
      watchTime: scenario.watchTime,
      attended: scenario.watchTime > 0,
      isReplay: scenario.isReplay || false,
      reachedOfferCTA
    });

    console.log(`\n🎯 Expected Tags:`);
    expectedTags.forEach(tag => {
      console.log(`   ✅ UM-Webinar-${tag}`);
    });

    // Step 6: Wait for async processing
    console.log(`\n⏳ Waiting 3 seconds for ClickFunnels sync...`);
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log(`\n✅ Test Complete!`);
    console.log(`\n📊 Verification Steps:`);
    console.log(`   1. Go to ClickFunnels → Contacts`);
    console.log(`   2. Search for: ${email}`);
    console.log(`   3. Verify these tags are applied:`);
    console.log(`      - UM-Webinar-Registered`);
    expectedTags.forEach(tag => {
      console.log(`      - UM-Webinar-${tag}`);
    });
    console.log(`   4. Check custom attributes:`);
    console.log(`      - watch_time_minutes: ${Math.floor(scenario.watchTime / 60)}`);
    console.log(`      - watch_percentage: ${Math.round((scenario.watchTime / scenario.webinarDuration) * 100)}`);
    console.log(`      - reached_offer: ${reachedOfferCTA}`);

    return true;

  } catch (error) {
    console.error(`\n❌ Test Error:`, error.message);
    return false;
  }
}

async function runAllTests() {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║     ClickFunnels Attendance Tagging - Comprehensive Tests       ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
  `);

  console.log(`📋 Testing ${SCENARIOS.length} scenarios\n`);
  console.log(`🎯 Server: ${API_BASE}`);
  console.log(`🎯 Webinar ID: ${WEBINAR_ID}`);
  console.log(`\n⚠️  Make sure your dev server is running: npm run dev`);
  console.log(`⚠️  Make sure ClickFunnels credentials are set in .env\n`);

  await new Promise(resolve => setTimeout(resolve, 2000));

  const results = [];

  for (let i = 0; i < SCENARIOS.length; i++) {
    const success = await testScenario(SCENARIOS[i], i);
    results.push({ scenario: SCENARIOS[i].name, success });
    
    if (i < SCENARIOS.length - 1) {
      console.log(`\n⏸️  Pausing 2 seconds before next test...\n`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Summary
  console.log(`\n${'='.repeat(70)}`);
  console.log(`TEST SUMMARY`);
  console.log(`${'='.repeat(70)}\n`);

  results.forEach((result, index) => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} Test ${index + 1}: ${result.scenario}`);
  });

  const passed = results.filter(r => r.success).length;
  const total = results.length;

  console.log(`\n📊 Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log(`\n🎉 All tests passed! Now verify tags in ClickFunnels dashboard.\n`);
  } else {
    console.log(`\n⚠️  Some tests failed. Check the logs above for details.\n`);
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${API_BASE}/api/health`, { method: 'GET' });
    return true;
  } catch (error) {
    return false;
  }
}

// Main
(async () => {
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.error(`
❌ ERROR: Development server is not running!

Please start the server first:
  $ npm run dev

Then run this test again:
  $ node scripts/test-all-tagging-scenarios.js
    `);
    process.exit(1);
  }

  await runAllTests();
})();
