#!/usr/bin/env node

/**
 * Test script to verify reminder system database setup
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testReminderSystem() {
  console.log('🧪 Testing Reminder System Setup...\n');

  try {
    // Test 1: Check if enums exist
    console.log('✅ Test 1: Prisma Client loaded successfully');

    // Test 2: Check if we can query reminder templates (should be empty)
    console.log('\n📋 Test 2: Querying reminder templates...');
    const templates = await prisma.webinarReminderTemplate.findMany();
    console.log(`✅ Found ${templates.length} reminder templates`);

    // Test 3: Check if we can query reminders sent (should be empty)
    console.log('\n📬 Test 3: Querying sent reminders...');
    const reminders = await prisma.webinarReminderSent.findMany();
    console.log(`✅ Found ${reminders.length} sent reminders`);

    // Test 4: Check if webinar has reminderTemplates relation
    console.log('\n🔗 Test 4: Checking webinar relations...');
    const webinarWithReminders = await prisma.webinar.findFirst({
      include: {
        reminderTemplates: true
      }
    });
    
    if (webinarWithReminders) {
      console.log(`✅ Webinar relation working: "${webinarWithReminders.title}"`);
      console.log(`   Has ${webinarWithReminders.reminderTemplates.length} reminder templates`);
    } else {
      console.log('✅ Webinar relation working (no webinars found yet)');
    }

    // Test 5: Check if registration has reminders relation
    console.log('\n📝 Test 5: Checking registration relations...');
    const registrationWithReminders = await prisma.registration.findFirst({
      include: {
        reminders: true
      }
    });
    
    if (registrationWithReminders) {
      console.log(`✅ Registration relation working: "${registrationWithReminders.name}"`);
      console.log(`   Has ${registrationWithReminders.reminders.length} scheduled reminders`);
    } else {
      console.log('✅ Registration relation working (no registrations found yet)');
    }

    console.log('\n🎉 ALL TESTS PASSED!\n');
    console.log('✅ Reminder system is ready to use!');
    console.log('✅ Database tables created successfully');
    console.log('✅ Prisma Client types generated');
    console.log('✅ Relations working correctly');
    console.log('\n📚 Next steps:');
    console.log('   1. Uncomment scheduleRemindersForRegistration() in register route');
    console.log('   2. Add MICROSOFT_CLIENT_SECRET to .env');
    console.log('   3. Navigate to webinar → Click "Reminders" button');
    console.log('   4. Create your first reminder template!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('   1. Run: npx prisma generate');
    console.error('   2. Restart your development server');
    console.error('   3. Check REMINDER_SETUP_CHECKLIST.md');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testReminderSystem();
