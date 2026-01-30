/**
 * Test Script for Free Event Popup Tracking Fix
 * 
 * This script can be used to manually test if tracking parameters
 * are properly captured from window.__WEBINAR_TRACKING__ in popup modals.
 * 
 * Usage:
 * 1. Open browser console on a lead page with custom HTML
 * 2. Copy and paste this entire script
 * 3. Run: testTrackingCapture()
 */

function testTrackingCapture() {
  console.log('🧪 Testing Tracking Parameter Capture\n');
  
  // Test 1: Check if __WEBINAR_TRACKING__ exists
  console.log('Test 1: Checking for window.__WEBINAR_TRACKING__...');
  const tracking = (window as any).__WEBINAR_TRACKING__;
  if (tracking) {
    console.log('✅ window.__WEBINAR_TRACKING__ found:', tracking);
  } else {
    console.log('❌ window.__WEBINAR_TRACKING__ not found');
    console.log('   This should be injected by lead pages with custom HTML');
    return;
  }
  
  // Test 2: Check URL parameters
  console.log('\nTest 2: Checking URL parameters...');
  const urlParams = new URLSearchParams(window.location.search);
  const urlSt = urlParams.get('st');
  const urlV = urlParams.get('v');
  const urlLp = urlParams.get('lp') || urlParams.get('leadPageId');
  
  if (urlSt || urlV || urlLp) {
    console.log('✅ URL parameters found:', { st: urlSt, v: urlV, lp: urlLp });
  } else {
    console.log('⚠️  No tracking parameters in URL (this is OK if using __WEBINAR_TRACKING__)');
  }
  
  // Test 3: Simulate what the embed script will do
  console.log('\nTest 3: Simulating embed script tracking detection...');
  
  // Match the actual embed script logic
  let webinarTrackingForEmbed = null;
  try {
    webinarTrackingForEmbed = (window as any).__WEBINAR_TRACKING__;
    if (!webinarTrackingForEmbed && window.self !== window.top) {
      webinarTrackingForEmbed = (window.parent as any).__WEBINAR_TRACKING__;
    }
  } catch (e) {
    // Cross-origin access blocked
  }
  
  const simulatedTracking = {
    splitTestId: urlSt || (webinarTrackingForEmbed?.splitTestId) || null,
    variantId: urlV || (webinarTrackingForEmbed?.variantId) || null,
    leadPageId: urlLp || (webinarTrackingForEmbed?.leadPageId) || null
  };
  console.log('Simulated TRACKING_PARAMS (matches embed script logic):', simulatedTracking);
  
  if (simulatedTracking.splitTestId || simulatedTracking.leadPageId) {
    console.log('✅ Tracking parameters will be captured correctly!');
  } else {
    console.log('❌ No tracking parameters will be captured');
  }
  
  // Test 4: Check parent window (if in iframe)
  console.log('\nTest 4: Checking parent window access...');
  if (window.self !== window.top) {
    try {
      const parentTracking = (window.parent as any).__WEBINAR_TRACKING__;
      if (parentTracking) {
        console.log('✅ Parent window.__WEBINAR_TRACKING__ found:', parentTracking);
      } else {
        console.log('⚠️  Parent window has no __WEBINAR_TRACKING__');
      }
    } catch (e) {
      console.log('❌ Cannot access parent window (cross-origin)');
    }
  } else {
    console.log('ℹ️  Not in an iframe');
  }
  
  // Summary
  console.log('\n📊 Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (tracking && (tracking.splitTestId || tracking.leadPageId)) {
    console.log('✅ PASS: Tracking parameters are available and will be captured');
    console.log('   When a popup modal opens, it will successfully track:');
    if (tracking.splitTestId) {
      console.log('   - Split Test ID:', tracking.splitTestId);
      console.log('   - Variant ID:', tracking.variantId);
    }
    if (tracking.leadPageId) {
      console.log('   - Lead Page ID:', tracking.leadPageId);
    }
  } else if (urlSt || urlLp) {
    console.log('✅ PASS: Tracking parameters are in URL and will be captured');
  } else {
    console.log('❌ FAIL: No tracking parameters available');
    console.log('   Registration will work but won\'t be attributed to split test or lead page');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Auto-run if this script is loaded directly
if (typeof window !== 'undefined') {
  console.log('🔍 Free Event Popup Tracking Test Script Loaded');
  console.log('Run testTrackingCapture() to test tracking parameter detection\n');
}
