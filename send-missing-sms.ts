import { PrismaClient } from '@prisma/client';
import { sendClickSendSMS } from './src/lib/clicksend';

const prisma = new PrismaClient();

async function sendMissingSMS() {
  // Get webinar and its post-webinar SMS template
  const webinar = await prisma.webinar.findFirst({
    where: {
      title: {
        contains: 'How to Help Your Child Love Islam'
      }
    },
    include: {
      reminderTemplates: {
        where: {
          type: 'post_webinar',
          isActive: true,
          OR: [
            { channel: 'SMS' },
            { channel: 'BOTH' }
          ]
        }
      }
    }
  });
  
  if (!webinar) {
    console.log('❌ Webinar not found');
    return;
  }
  
  const template = webinar.reminderTemplates[0];
  if (!template) {
    console.log('❌ No active post-webinar SMS template found');
    return;
  }
  
  console.log('📋 Webinar:', webinar.title);
  console.log('📱 Template requires:', template.minWatchedMinutes, 'minutes watched\n');
  
  // Get all eligible attendees
  const minSeconds = template.minWatchedMinutes! * 60;
  
  const eligible = await prisma.registration.findMany({
    where: {
      webinarId: webinar.id,
      attended: true,
      phone: { not: null },
      lastWatchedPosition: { gte: minSeconds }
    }
  });
  
  console.log(`✅ Found ${eligible.length} eligible attendees\n`);
  
  let sent = 0;
  let skipped = 0;
  let failed = 0;
  
  for (const reg of eligible) {
    const watchMin = Math.floor(reg.lastWatchedPosition! / 60);
    
    // Check if already sent
    const existing = await prisma.webinarReminderSent.findFirst({
      where: {
        registrationId: reg.id,
        type: 'post_webinar'
      }
    });
    
    if (existing) {
      console.log(`⏭️  ${reg.email} - Already sent (${existing.status})`);
      skipped++;
      continue;
    }
    
    console.log(`📤 Sending to ${reg.name} (${reg.email}) - watched ${watchMin} min...`);
    
    try {
      // Replace variables in SMS
      let message = template.smsBody!
        .replace(/\{\{name\}\}/g, reg.name || 'Sister')
        .replace(/\{\{webinarTitle\}\}/g, webinar.title);
      
      // Send SMS
      const result = await sendClickSendSMS(reg.phone!, message);
      
      if (!result.success) {
        throw new Error(result.error || 'SMS send failed');
      }
      
      // Record in database
      await prisma.webinarReminderSent.create({
        data: {
          registrationId: reg.id,
          templateId: template.id,
          type: 'post_webinar',
          channel: 'SMS',
          status: 'SENT',
          sentAt: new Date()
        }
      });
      
      console.log(`   ✅ Sent successfully`);
      sent++;
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error: any) {
      console.log(`   ❌ Failed:`, error.message);
      
      // Record failure
      await prisma.webinarReminderSent.create({
        data: {
          registrationId: reg.id,
          templateId: template.id,
          type: 'post_webinar',
          channel: 'SMS',
          status: 'FAILED',
          errorMessage: error.message
        }
      });
      
      failed++;
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`   ✅ Sent: ${sent}`);
  console.log(`   ⏭️  Skipped (already sent): ${skipped}`);
  console.log(`   ❌ Failed: ${failed}`);
  
  await prisma.$disconnect();
}

sendMissingSMS().catch(console.error);
