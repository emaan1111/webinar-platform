/**
 * Send SMS to all event registrations NOW
 * Usage: node scripts/send-event-sms-now.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ClickSend API configuration
const CLICK_SEND_USERNAME = process.env.CLICK_SEND_USERNAME;
const CLICK_SEND_API_KEY = process.env.CLICK_SEND_API_KEY;
const CLICK_SEND_FROM = process.env.CLICK_SEND_FROM;

// The message to send
const SMS_MESSAGE = "Your kids class - Heroes journey has started JOIN NOW so they don't miss out https://us06web.zoom.us/j/88213329940";

// Event to target (search by title/slug)
const EVENT_SEARCH = "hero";

function normalizePhoneNumber(phone) {
  if (!phone) return null;
  const normalized = phone.trim().replace(/[^\d+]/g, '');
  if (!normalized || normalized.length < 10) return null;
  // Ensure it starts with +
  if (!normalized.startsWith('+')) {
    // Assume US if 10 digits
    if (normalized.length === 10) {
      return '+1' + normalized;
    }
    return '+' + normalized;
  }
  return normalized;
}

async function sendClickSendSMS(to, message) {
  if (!CLICK_SEND_USERNAME || !CLICK_SEND_API_KEY) {
    console.error('❌ ClickSend credentials not configured');
    return { success: false, error: 'Missing credentials' };
  }

  const auth = Buffer.from(`${CLICK_SEND_USERNAME}:${CLICK_SEND_API_KEY}`).toString('base64');
  
  try {
    const response = await fetch('https://rest.clicksend.com/v3/sms/send', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{
          source: 'nodejs',
          from: CLICK_SEND_FROM || 'EmaanPower',
          body: message,
          to: to,
        }]
      })
    });

    const data = await response.json();
    
    if (response.ok && data.response_code === 'SUCCESS') {
      return { success: true };
    } else {
      return { success: false, error: JSON.stringify(data) };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🔍 Finding Heroes Journey event registrations...\n');

  // Find the event
  const events = await prisma.event.findMany({
    where: {
      OR: [
        { title: { contains: EVENT_SEARCH, mode: 'insensitive' } },
        { slug: { contains: EVENT_SEARCH, mode: 'insensitive' } }
      ]
    },
    include: {
      registrations: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        }
      }
    }
  });

  if (events.length === 0) {
    console.log('❌ No events found matching:', EVENT_SEARCH);
    await prisma.$disconnect();
    return;
  }

  console.log('Found events:');
  events.forEach(e => console.log(`  - ${e.title} (${e.registrations.length} registrations)`));
  console.log('');

  // Collect all unique phone numbers
  const phoneMap = new Map(); // phone -> { name, email }
  
  for (const event of events) {
    for (const reg of event.registrations) {
      const phone = normalizePhoneNumber(reg.phone);
      if (phone && !phoneMap.has(phone)) {
        phoneMap.set(phone, { name: reg.name, email: reg.email });
      }
    }
  }

  console.log(`📱 Found ${phoneMap.size} unique phone numbers\n`);

  if (phoneMap.size === 0) {
    console.log('❌ No registrations with valid phone numbers');
    await prisma.$disconnect();
    return;
  }

  // List them
  console.log('Recipients:');
  for (const [phone, info] of phoneMap) {
    console.log(`  ${info.name} - ${phone}`);
  }
  console.log('');

  // Confirm before sending
  console.log('📨 Message to send:');
  console.log(`"${SMS_MESSAGE}"\n`);

  // Check if --send flag is passed
  const shouldSend = process.argv.includes('--send');
  
  if (!shouldSend) {
    console.log('⚠️  DRY RUN - Add --send flag to actually send SMS');
    console.log('   node scripts/send-event-sms-now.js --send');
    await prisma.$disconnect();
    return;
  }

  // Send SMS to each
  console.log('🚀 Sending SMS...\n');
  
  let sent = 0;
  let failed = 0;

  for (const [phone, info] of phoneMap) {
    process.stdout.write(`  Sending to ${info.name} (${phone})... `);
    
    const result = await sendClickSendSMS(phone, SMS_MESSAGE);
    
    if (result.success) {
      console.log('✅');
      sent++;
    } else {
      console.log(`❌ ${result.error}`);
      failed++;
    }
    
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 200));
  }

  console.log('\n==========================================');
  console.log(`📊 Summary:`);
  console.log(`   ✅ Sent: ${sent}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log('==========================================');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
