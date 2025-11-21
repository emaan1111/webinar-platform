const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const registration = await prisma.registration.findFirst({
    where: {
      email: 'humera_naz@hotmail.co.uk'
    },
    include: {
      webinar: {
        select: {
          id: true,
          title: true,
          status: true,
          scheduledAt: true,
          duration: true,
          mostlyAttendedThreshold: true,
          reminderTemplates: {
            where: {
              type: 'post_webinar',
              isActive: true,
              OR: [
                { channel: 'SMS' },
                { channel: 'BOTH' }
              ]
            },
            select: {
              id: true,
              minutesAfter: true,
              minWatchedMinutes: true,
              minWatchedPercentage: true,
              smsBody: true
            }
          }
        }
      },
      reminders: {
        where: {
          type: 'post_webinar'
        },
        select: {
          id: true,
          status: true,
          sentAt: true,
          errorMessage: true,
          scheduledFor: true
        }
      }
    }
  });

  if (!registration) {
    console.log('❌ Registration not found for humera_naz@hotmail.co.uk');
    await prisma.$disconnect();
    return;
  }

  console.log('📊 Registration Details for humera_naz@hotmail.co.uk');
  console.log('='.repeat(80));
  console.log('Name:', registration.name);
  console.log('Email:', registration.email);
  console.log('Phone:', registration.phone || 'No phone number ❌');
  console.log('Attended:', registration.attended ? '✅ Yes' : '❌ No');
  console.log('Last Watched Position:', registration.lastWatchedPosition, 'seconds');
  
  const watchMinutes = Math.floor((registration.lastWatchedPosition || 0) / 60);
  console.log('Watch Time:', watchMinutes, 'minutes');
  
  console.log('\nWebinar:');
  console.log('  Title:', registration.webinar.title);
  console.log('  Status:', registration.webinar.status);
  console.log('  Duration:', registration.webinar.duration, 'minutes');
  console.log('  Scheduled:', registration.webinar.scheduledAt?.toISOString());
  
  const webinarEndTime = new Date(registration.webinar.scheduledAt);
  webinarEndTime.setMinutes(webinarEndTime.getMinutes() + (registration.webinar.duration || 60));
  console.log('  Ended At:', webinarEndTime.toISOString());
  console.log('  Has Ended:', new Date() > webinarEndTime ? '✅ Yes' : '❌ No');

  console.log('\n📱 Post-Webinar SMS Templates:', registration.webinar.reminderTemplates.length);
  if (registration.webinar.reminderTemplates.length === 0) {
    console.log('  ❌ No post-webinar SMS templates configured for this webinar');
  } else {
    registration.webinar.reminderTemplates.forEach((template, idx) => {
      console.log(`\n  Template ${idx + 1}:`);
      console.log('    ID:', template.id);
      console.log('    Timing:', template.minutesAfter, 'minutes after');
      console.log('    Min Watch Minutes:', template.minWatchedMinutes || 'None');
      console.log('    Min Watch Percentage:', template.minWatchedPercentage || 'None');
      console.log('    Has SMS Body:', template.smsBody ? '✅ Yes' : '❌ No');
      
      // Check if meets criteria
      let meetsCriteria = false;
      let criteriaReason = '';
      
      if (template.minWatchedMinutes) {
        meetsCriteria = watchMinutes >= template.minWatchedMinutes;
        criteriaReason = `${watchMinutes} min ${meetsCriteria ? '≥' : '<'} ${template.minWatchedMinutes} min`;
      } else if (template.minWatchedPercentage) {
        const watchPercentage = Math.round((watchMinutes / (registration.webinar.duration || 60)) * 100);
        meetsCriteria = watchPercentage >= template.minWatchedPercentage;
        criteriaReason = `${watchPercentage}% ${meetsCriteria ? '≥' : '<'} ${template.minWatchedPercentage}%`;
      } else {
        meetsCriteria = registration.attended;
        criteriaReason = registration.attended ? 'Attended' : 'Did not attend';
      }
      
      console.log(`    Meets Criteria: ${meetsCriteria ? '✅' : '❌'} (${criteriaReason})`);
    });
  }

  console.log('\n📬 Post-Webinar Reminders in Database:', registration.reminders.length);
  if (registration.reminders.length > 0) {
    registration.reminders.forEach((reminder, idx) => {
      console.log(`\n  Reminder ${idx + 1}:`);
      console.log('    ID:', reminder.id);
      console.log('    Status:', reminder.status);
      console.log('    Scheduled For:', reminder.scheduledFor?.toISOString() || 'Unknown');
      console.log('    Sent At:', reminder.sentAt?.toISOString() || 'Not sent yet');
      console.log('    Error:', reminder.errorMessage || 'None');
    });
  } else {
    console.log('  ❌ No post-webinar reminders found in database');
  }

  console.log('\n' + '='.repeat(80));
  console.log('📋 ELIGIBILITY CHECK:');
  console.log('='.repeat(80));
  
  const hasPhone = !!registration.phone;
  const attended = registration.attended;
  const hasTemplates = registration.webinar.reminderTemplates.length > 0;
  const webinarEnded = new Date() > webinarEndTime;
  
  console.log('✓ Has Phone Number:', hasPhone ? '✅ Yes' : '❌ No');
  console.log('✓ Attended Webinar:', attended ? '✅ Yes' : '❌ No');
  console.log('✓ Has Post-Webinar SMS Templates:', hasTemplates ? '✅ Yes' : '❌ No');
  console.log('✓ Webinar Has Ended:', webinarEnded ? '✅ Yes' : '❌ No');
  
  if (hasTemplates) {
    const meetsAnyCriteria = registration.webinar.reminderTemplates.some(template => {
      if (template.minWatchedMinutes) {
        return watchMinutes >= template.minWatchedMinutes;
      } else if (template.minWatchedPercentage) {
        const watchPercentage = Math.round((watchMinutes / (registration.webinar.duration || 60)) * 100);
        return watchPercentage >= template.minWatchedPercentage;
      } else {
        return attended;
      }
    });
    console.log('✓ Meets Watch Criteria:', meetsAnyCriteria ? '✅ Yes' : '❌ No');
  }
  
  console.log('\n' + '='.repeat(80));
  if (hasPhone && attended && hasTemplates && webinarEnded) {
    console.log('✅ SHOULD RECEIVE POST-WEBINAR SMS');
    
    if (registration.reminders.length === 0) {
      console.log('\n⚠️  WARNING: No reminders were scheduled for this registration!');
      console.log('   This means the post-webinar automation did not trigger.');
      console.log('   Possible reasons:');
      console.log('   1. Cron job has not run yet');
      console.log('   2. Template was created after the webinar ended');
      console.log('   3. There was an error during reminder scheduling');
    }
  } else {
    console.log('❌ DOES NOT MEET CRITERIA FOR POST-WEBINAR SMS');
    if (!hasPhone) console.log('   ❌ Reason: No phone number');
    if (!attended) console.log('   ❌ Reason: Did not attend');
    if (!hasTemplates) console.log('   ❌ Reason: No post-webinar SMS templates configured');
    if (!webinarEnded) console.log('   ❌ Reason: Webinar has not ended yet');
  }

  await prisma.$disconnect();
})();
