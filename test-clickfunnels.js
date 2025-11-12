// Test ClickFunnels Integration
// This script tests the outgoing API (Platform → ClickFunnels)

const testRegistration = async () => {
  const webinarId = 'cmhv6o0ps0005jwlgxig6b8qw'; // asdasdasdas (Copy) (Copy)
  const apiUrl = `http://localhost:3001/api/webinars/${webinarId}/register`;

  const testData = {
    name: 'Test User ClickFunnels',
    email: `test.cf.${Date.now()}@example.com`,
    phone: '+1234567890',
    timezone: 'America/New_York',
    country: 'US',
    privacyConsent: true,
    marketingConsent: true,
    gdprConsent: false
  };

  console.log('🧪 Testing ClickFunnels Integration\n');
  console.log('📝 Test Registration Data:');
  console.log(JSON.stringify(testData, null, 2));
  console.log('\n📤 Sending registration request...\n');

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Registration Successful!\n');
      console.log('Response:', JSON.stringify(result, null, 2));
      console.log('\n📊 Next Steps:');
      console.log('1. Check your terminal logs for ClickFunnels sync messages:');
      console.log('   📤 Sending contact to ClickFunnels: ' + testData.email);
      console.log('   ✅ Contact sent to ClickFunnels: con_xxxxx');
      console.log('   ✅ Webinar registration synced to ClickFunnels');
      console.log('\n2. Go to ClickFunnels → Contacts');
      console.log('3. Search for: ' + testData.email);
      console.log('4. Verify tag: UM-Webinar-Registered');
      console.log('5. Check custom fields are populated\n');
    } else {
      console.log('❌ Registration Failed\n');
      console.log('Error:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
  }
};

testRegistration();
