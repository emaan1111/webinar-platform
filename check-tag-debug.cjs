const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const emails = [
  'ayeshafomar786@gmail.com',
  'sarasoso982015@gmail.com',
  'faridaakter190@gmail.com'
];

async function main() {
  for (const email of emails) {
    console.log('\n' + '='.repeat(60));
    console.log('Checking:', email);
    console.log('='.repeat(60));
    
    const reg = await prisma.registration.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    include: {
      webinar: {
        select: {
          id: true, 
          title: true,
          mostlyAttendedTag: true,
          mostlyAttendedTagId: true,
          mostlyAttendedThreshold: true,
          duration: true,
          videoDuration: true
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
  
  if (reg) {
    console.log('Registration:', JSON.stringify({
      id: reg.id,
      email: reg.email,
      attended: reg.attended,
      lastWatchedPosition: reg.lastWatchedPosition,
      replayWatchTime: reg.replayWatchTime,
      attendanceTagsApplied: reg.attendanceTagsApplied,
      attendanceTagsAppliedAt: reg.attendanceTagsAppliedAt,
      webinar: reg.webinar,
      sessions: reg.sessions
    }, null, 2));
    
    // Calculate effective watch time
    const sessionWatchTime = reg.sessions.reduce((sum, s) => sum + (s.watchDuration || s.totalWatchTime || 0), 0);
    const effectiveWatchTime = Math.max(
      sessionWatchTime,
      reg.replayWatchTime || 0,
      reg.lastWatchedPosition || 0
    );
    
    console.log('\nEffective watch time:', effectiveWatchTime, 'seconds');
    console.log('Threshold:', reg.webinar?.mostlyAttendedThreshold, 'seconds');
    console.log('Would qualify for MOSTLY_ATTENDED:', effectiveWatchTime >= (reg.webinar?.mostlyAttendedThreshold || 0));
    console.log('Tag to apply:', reg.webinar?.mostlyAttendedTag || 'UM-WebinarMostlyAttended');
    console.log('Tag ID configured:', reg.webinar?.mostlyAttendedTagId);
  }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
