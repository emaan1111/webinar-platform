const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkReminders() {
  const reg = await prisma.registration.findFirst({
    where: { email: 'humera_naz@hotmail.co.uk' },
    include: {
      webinar: {
        include: {
          reminderTemplates: {
            where: {
              type: 'post_webinar',
              OR: [
                { channel: 'SMS' },
                { channel: 'BOTH' }
              ]
            }
          }
        }
      },
      reminders: {
        where: {
          type: 'post_webinar'
        }
      }
    }
  });
  
  console.log('\n📋 Webinar:', reg.webinar.title);
  console.log('📱 Post-Webinar SMS Templates:', reg.webinar.reminderTemplates.length);
  
  if (reg.webinar.reminderTemplates.length > 0) {
    reg.webinar.reminderTemplates.forEach((t, i) => {
      console.log(`\n${i+1}. Template ID: ${t.id}`);
      console.log(`   Active: ${t.isActive}`);
      console.log(`   Channel: ${t.channel}`);
      console.log(`   Min Watched: ${t.minWatchedMinutes || t.minWatchedPercentage + '%'}`);
      console.log(`   Message: ${(t.smsBody || '').substring(0, 50)}...`);
    });
  }
  
  console.log('\n📤 Reminders Sent to Her:', reg.reminders.length);
  if (reg.reminders.length > 0) {
    reg.reminders.forEach((r, i) => {
      console.log(`\n${i+1}. Status: ${r.status}`);
      console.log(`   Scheduled: ${r.scheduledFor}`);
      console.log(`   Sent: ${r.sentAt || 'Not yet'}`);
      console.log(`   Error: ${r.errorMessage || 'None'}`);
    });
  } else {
    console.log('   ❌ NO REMINDERS SCHEDULED OR SENT');
  }
  
  await prisma.$disconnect();
}

checkReminders().catch(console.error);
