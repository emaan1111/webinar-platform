#!/usr/bin/env node

/**
 * ClickFunnels Webhook Test Script
 * 
 * This script sends a test order.created webhook to your local server
 * to verify the webhook is working correctly.
 */

const http = require('http');

// Test webhook payload matching ClickFunnels format
const testPayload = {
  event_type: 'order.created',
  order: {
    id: 'TEST_' + Date.now(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: 'completed',
    total: 297.00,
    total_amount: 297.00,
    amount: 297.00,
    currency: 'USD',
    products: [
      {
        id: 'prod_test_001',
        name: 'Test Webinar Product',
        price: 297.00,
        quantity: 1
      }
    ],
    customer: {
      id: 'cust_test_001',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      phone: '+1234567890'
    },
    funnel: {
      id: 'funnel_test_001',
      name: 'Test Funnel'
    },
    order_form: {
      id: 'form_test_001',
      name: 'Test Order Form'
    }
  }
};

console.log('🧪 ClickFunnels Webhook Test\n');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('📦 Test Payload:');
console.log(JSON.stringify(testPayload, null, 2));
console.log('\n═══════════════════════════════════════════════════════════\n');

const data = JSON.stringify(testPayload);

const options = {
  hostname: 'localhost',
  port: 3003,
  path: '/api/integrations/clickfunnels/webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'User-Agent': 'ClickFunnels-Webhook-Test'
  }
};

console.log('🚀 Sending test webhook to: http://localhost:3003/api/integrations/clickfunnels/webhook\n');

const req = http.request(options, (res) => {
  console.log(`📡 Response Status: ${res.statusCode} ${res.statusMessage}`);
  console.log(`📋 Response Headers:`, res.headers);
  console.log('');

  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('📥 Response Body:');
    try {
      const parsed = JSON.parse(responseData);
      console.log(JSON.stringify(parsed, null, 2));
      
      if (res.statusCode === 200) {
        console.log('\n✅ SUCCESS! Webhook processed successfully.');
        console.log('\n📝 Next Steps:');
        console.log('   1. Check the database for the new sale record');
        console.log('   2. Verify the amount ($297.00) was recorded correctly');
        console.log('   3. Check reports page to see if revenue updated');
      } else {
        console.log('\n⚠️  Webhook received but may have errors.');
      }
    } catch (e) {
      console.log(responseData);
      if (res.statusCode === 200) {
        console.log('\n✅ SUCCESS! Webhook processed (non-JSON response).');
      }
    }
    
    console.log('\n═══════════════════════════════════════════════════════════\n');
    console.log('🔍 Verify the sale in database:');
    console.log('   Run: node -e "const {PrismaClient}=require(\'@prisma/client\');const p=new PrismaClient();p.webinarSale.findMany({take:1,orderBy:{purchasedAt:\'desc\'}}).then(s=>console.log(s)).finally(()=>p.$disconnect())"');
  });
});

req.on('error', (error) => {
  console.error('❌ ERROR:', error.message);
  console.log('\n💡 Make sure your dev server is running on port 3003');
  console.log('   Run: npm run dev');
});

req.write(data);
req.end();
