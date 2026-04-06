const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get registrations from the last 2 days that should have been tagged
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  
  const regs = await prisma.registration.findMany({
    where: {
      registeredAt: { gte: twoDaysAgo },
      attended: true  // Only those who attended
    },
    select: {
      id: true,
      email: true,
      attended: true,
      lastWatchedPosition: true,
      replayWatchTime: true,
      attendanceTagsApplied: true,
      attendanceTagsAppliedAt: true,
      scheduledStartTime: true,
      registeredAt: true,
      webinar: {
        select: {
          title: true,
          mostlyAttendedThreshold: true,
          mostlyAttendedTag: true,
          mostlyAttendedTagId: true,
          duration: true
        }
      }
    },
    orderBy: { registeredAt: 'desc' },
    take: 30
  });
  
  console.log(`Found ${regs.length} recent attended registrations:\n`);
  
  for (const reg of regs) {
    const effectiveWatchTime = Math.max(reg.lastWatchedPosition || 0, reg.replayWatchTime || 0);
    const threshold = reg.webinar?.mostlyAttendedThreshold || 0;
    const wouldQualify = effectiveWatchTime >= threshold;
    
    console.log(`Email: ${reg.email}`);
    console.log(`  Registered: ${reg.registeredAt}`);
    console.log(`  Scheduled: ${reg.scheduledStartTime}`);
    console.log(`  Watch time: ${effectiveWatchTime}s, Threshold: ${threshold}s`);
    console.log(`  Would qualify for MOSTLY_ATTENDED: ${wouldQualify}`);
    console.log(`  attendanceTagsApplied: ${reg.attendanceTagsApplied}`);
    console.log(`  attendanceTagsAppliedAt: ${reg.attendanceTagsAppliedAt}`);
    console.log(`  Tag configured: ${reg.webinar?.mostlyAttendedTag}`);
    console.log(`  Tag ID: ${reg.webinar?.mostlyAttendedTagId}`);
    console.log('');
  }
  
  // Summary
  const tagged = regs.filter(r => r.attendanceTagsApplied);
  const notTagged = regs.filter(r => !r.attendanceTagsApplied);
  
  console.log('--- SUMMARY ---');
  console.log(`Total attended: ${regs.length}`);
  console.log(`Tagged (attendanceTagsApplied=true): ${tagged.length}`);
  console.log(`Not tagged yet: ${notTagged.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
