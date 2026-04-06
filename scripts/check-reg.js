const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || 'arfarheen43@gmail.com';
  
  const reg = await prisma.registration.findFirst({
    where: { email },
    select: {
      id: true,
      email: true,
      attended: true,
      scheduledStartTime: true,
      attendanceTagsApplied: true,
      attendanceTagsAppliedAt: true,
      lastWatchedPosition: true,
      replayWatchTime: true,
      webinar: {
        select: {
          duration: true,
          title: true,
          mostlyAttendedThreshold: true,
          attendedTag: true,
          attendedTagId: true,
          mostlyAttendedTag: true,
          mostlyAttendedTagId: true,
          partlyAttendedTag: true,
          partlyAttendedTagId: true,
          missedTag: true,
          missedTagId: true,
        }
      },
      sessions: {
        select: {
          watchDuration: true,
          totalWatchTime: true
        }
      }
    },
    orderBy: { registeredAt: 'desc' }
  });
  
  if (!reg) {
    console.log('Registration not found for:', email);
    return;
  }
  
  const now = new Date();
  const sessionEnd = reg.scheduledStartTime && reg.webinar.duration 
    ? new Date(reg.scheduledStartTime.getTime() + (reg.webinar.duration * 60 * 1000))
    : null;
  
  console.log('\n📊 Registration Details:');
  console.log('ID:', reg.id);
  console.log('Email:', reg.email);
  console.log('Webinar:', reg.webinar.title);
  console.log('Attended:', reg.attended);
  console.log('Tags Applied:', reg.attendanceTagsApplied);
  console.log('Tags Applied At:', reg.attendanceTagsAppliedAt);
  
  console.log('\n⏱️ Timing:');
  console.log('Scheduled Start:', reg.scheduledStartTime);
  console.log('Duration (mins):', reg.webinar.duration);
  console.log('Session End:', sessionEnd);
  console.log('Now:', now);
  console.log('Session Ended?:', sessionEnd ? sessionEnd < now : 'N/A');
  
  console.log('\n📺 Watch Data:');
  console.log('Last Watched Position:', reg.lastWatchedPosition);
  console.log('Replay Watch Time:', reg.replayWatchTime);
  const sessionWatchTime = reg.sessions.reduce((sum, s) => sum + (s.watchDuration || s.totalWatchTime || 0), 0);
  console.log('Session Watch Time:', sessionWatchTime);
  const effectiveWatchTime = Math.max(sessionWatchTime, reg.replayWatchTime || 0, reg.lastWatchedPosition || 0);
  console.log('Effective Watch Time:', effectiveWatchTime);
  console.log('Threshold:', reg.webinar.mostlyAttendedThreshold);
  
  console.log('\n🏷️ Tag Config:');
  console.log('attendedTag:', reg.webinar.attendedTag, '| ID:', reg.webinar.attendedTagId);
  console.log('mostlyAttendedTag:', reg.webinar.mostlyAttendedTag, '| ID:', reg.webinar.mostlyAttendedTagId);
  console.log('partlyAttendedTag:', reg.webinar.partlyAttendedTag, '| ID:', reg.webinar.partlyAttendedTagId);
  console.log('missedTag:', reg.webinar.missedTag, '| ID:', reg.webinar.missedTagId);
  
  // Determine expected tag
  let expectedTag = 'MISSED';
  if (reg.attended) {
    if (reg.webinar.mostlyAttendedThreshold && effectiveWatchTime >= reg.webinar.mostlyAttendedThreshold) {
      expectedTag = 'MOSTLY_ATTENDED';
    } else if (reg.webinar.mostlyAttendedThreshold && effectiveWatchTime > 0) {
      expectedTag = 'PARTLY_ATTENDED';
    } else {
      expectedTag = 'ATTENDED';
    }
  }
  console.log('\n🎯 Expected Tag:', expectedTag);
  
  if (!reg.attendanceTagsApplied && sessionEnd && sessionEnd < now) {
    console.log('\n✅ This registration SHOULD be processed by cron');
  } else if (reg.attendanceTagsApplied) {
    console.log('\n⚠️ Tags already marked as applied - cron will skip this');
  } else {
    console.log('\n⏳ Session not ended yet - cron will skip this');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
