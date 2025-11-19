/**
 * Backfill Script: Schedule reminders for existing registrations
 * 
 * This script finds all registrations that don't have reminders scheduled
 * and creates the reminder records for them.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function backfillReminders() {
  console.log('🔄 Starting reminder backfill process...\n');

  try {
    // Find all registrations without any reminders
    const registrationsWithoutReminders = await prisma.registration.findMany({
      where: {
        reminders: {
          none: {}
        },
        // Only for webinars that haven't started yet
        scheduledStartTime: {
          gt: new Date()
        }
      },
      include: {
        webinar: {
          include: {
            reminderTemplates: {
              where: {
                isActive: true
              }
            }
          }
        }
      }
    });

    console.log(`📊 Found ${registrationsWithoutReminders.length} registrations without reminders\n`);

    if (registrationsWithoutReminders.length === 0) {
      console.log('✅ No registrations need backfill. All done!');
      await prisma.$disconnect();
      return;
    }

    let totalScheduled = 0;
    let totalSkipped = 0;

    for (const registration of registrationsWithoutReminders) {
      const webinar = registration.webinar;
      
      if (!webinar.reminderTemplates || webinar.reminderTemplates.length === 0) {
        console.log(`⏭️  Skipping registration ${registration.id} - no active reminder templates`);
        continue;
      }

      console.log(`\n📝 Processing: ${registration.name || registration.email}`);
      console.log(`   Webinar: "${webinar.title}"`);
      console.log(`   Start: ${registration.scheduledStartTime}`);
      console.log(`   Phone: ${registration.phone || 'No phone'}`);

      const now = new Date();
      const webinarStartTime = new Date(registration.scheduledStartTime);
      const remindersToCreate = [];

      for (const template of webinar.reminderTemplates) {
        const scheduledFor = new Date(webinarStartTime.getTime() - template.minutesBefore * 60 * 1000);

        // Only schedule if the reminder time is in the future
        if (scheduledFor > now) {
          // For SMS/BOTH channels, check if phone exists
          if ((template.channel === 'SMS' || template.channel === 'BOTH') && !registration.phone) {
            console.log(`   ⚠️  Skipped ${template.channel} reminder (${template.minutesBefore} min before) - no phone number`);
            totalSkipped++;
            continue;
          }

          remindersToCreate.push({
            templateId: template.id,
            registrationId: registration.id,
            scheduledFor,
            status: 'PENDING',
            channel: template.channel
          });

          console.log(`   ✅ Scheduled ${template.channel} reminder: ${template.minutesBefore} min before (${scheduledFor.toISOString()})`);
          totalScheduled++;
        } else {
          console.log(`   ⏭️  Skipped reminder: ${template.minutesBefore} min before (time has passed)`);
          totalSkipped++;
        }
      }

      // Create all reminders for this registration
      if (remindersToCreate.length > 0) {
        await prisma.webinarReminderSent.createMany({
          data: remindersToCreate
        });
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Backfill Complete!');
    console.log(`   📨 Reminders scheduled: ${totalScheduled}`);
    console.log(`   ⏭️  Reminders skipped: ${totalSkipped}`);
    console.log('='.repeat(60));

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during backfill:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Run the backfill
backfillReminders();
