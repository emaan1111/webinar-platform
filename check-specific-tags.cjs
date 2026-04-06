const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Check specific emails that were reported as not tagged
const emails = [
  'ayeshafomar786@gmail.com',
  'sarasoso982015@gmail.com', 
  'faridaakter190@gmail.com'
];

async function main() {
  for (const email of emails) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Checking: ${email}`);
    console.log('='.repeat(60));
    
    const reg = await prisma.registration.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: {
        id: true,
        email: true,
        attended: true,
        lastWatchedPosition: true,
        attendanceTagsApplied: true,
        attendanceTagsAppliedAt: true,
        scheduledStartTime: true,
        webinar: {
          select: {
            title: true,
            duration: true,
            mostlyAttendedThreshold: true,
            mostlyAttendedTag: true,
            partlyAttendedTag: true,
            missedTag: true
          }
        },
        sessions: {
          select: { watchDuration: true }
        }
      },
      orderBy: { registeredAt: 'desc' }
    });
    
    if (!reg) {
      console.log('NOT FOUND');
      continue;
    }
    
    const sessionWatchTime = reg.sessions.reduce((sum, s) => sum + (s.watchDuration || 0), 0);
    const effectiveWatchTime = Math.max(sessionWatchTime, reg.lastWatchedPosition || 0);
    const threshold = reg.webinar?.mostlyAttendedThreshold || 0;
    
    console.log(`Webinar: ${reg.webinar?.title}`);
    console.log(`Scheduled: ${reg.scheduledStartTime}`);
    console.log(`Attended: ${reg.attended}`);
    console.log(`Watch time: ${effectiveWatchTime}s (threshold: ${threshold}s)`);
    console.log(`attendanceTagsApplied: ${reg.attendanceTagsApplied}`);
    console.log(`attendanceTagsAppliedAt: ${reg.attendanceTagsAppliedAt}`);
    
    // What tag SHOULD have been applied?
    if (!reg.attended) {
      console.log(`Expected tag: MISSED (${reg.webinar?.missedTag})`);
    } else if (effectiveWatchTime >= threshold) {
      console.log(`Expected tag: MOSTLY_ATTENDED (${reg.webinar?.mostlyAttendedTag})`);
    } else {
      console.log(`Expected tag: PARTLY_ATTENDED (${reg.webinar?.partlyAttendedTag})`);
    }
  }
  
  // Also check recent ones that are marked as tagged
  console.log(`\n\n${'='.repeat(60)}`);
  console.log('RECENT TAGGED REGISTRATIONS');
  console.log('='.repeat(60));
  
  const recent = await prisma.registration.findMany({
    where: {
      attendanceTagsApplied: true,
      attendanceTagsAppliedAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      }
    },
    select: {
      email: true,
      attended: true,
      lastWatchedPosition: true,
      attendanceTagsAppliedAt: true,
      webinar: {
        select: { mostlyAttendedThreshold: true }
      }
    },
    take: 10,
    orderBy: { attendanceTagsAppliedAt: 'desc' }
  });
  
  for (const r of recent) {
    const threshold = r.webinar?.mostlyAttendedThreshold || 0;
    const watchTime = r.lastWatchedPosition || 0;
    let expectedTag = 'MISSED';
    if (r.attended) {
      expectedTag = watchTime >= threshold ? 'MOSTLY_ATTENDED' : 'PARTLY_ATTENDED';
    }
    console.log(`${r.email}: ${expectedTag} (watch: ${watchTime}s, threshold: ${threshold}s) - tagged at ${r.attendanceTagsAppliedAt}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
