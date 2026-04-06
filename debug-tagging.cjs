const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  
  // Find registrations that should be tagged (session ended, not yet tagged)
  const registrations = await prisma.registration.findMany({
    where: {
      attendanceTagsApplied: false,
      scheduledStartTime: { not: null }
    },
    select: {
      id: true,
      email: true,
      attended: true,
      scheduledStartTime: true,
      lastWatchedPosition: true,
      webinar: {
        select: {
          title: true,
          duration: true
        }
      }
    },
    take: 30,
    orderBy: { registeredAt: 'desc' }
  });
  
  console.log(`Found ${registrations.length} registrations with attendanceTagsApplied=false\n`);
  
  let endedCount = 0;
  let notEndedCount = 0;
  
  for (const reg of registrations) {
    if (!reg.scheduledStartTime || !reg.webinar?.duration) {
      console.log(`${reg.email}: Missing scheduledStartTime or duration`);
      continue;
    }
    
    const sessionEndTime = new Date(
      reg.scheduledStartTime.getTime() + 
      (reg.webinar.duration * 60 * 1000)
    );
    
    const hasEnded = sessionEndTime < now;
    
    if (hasEnded) {
      endedCount++;
      console.log(`SHOULD BE TAGGED: ${reg.email}`);
      console.log(`  Webinar: ${reg.webinar.title}`);
      console.log(`  Scheduled: ${reg.scheduledStartTime}`);
      console.log(`  Session End: ${sessionEndTime}`);
      console.log(`  Attended: ${reg.attended}`);
      console.log(`  Watch time: ${reg.lastWatchedPosition || 0}s`);
      console.log('');
    } else {
      notEndedCount++;
    }
  }
  
  console.log(`\n--- SUMMARY ---`);
  console.log(`Sessions ended (should be tagged): ${endedCount}`);
  console.log(`Sessions not ended yet: ${notEndedCount}`);
  
  // Also check how many are marked as tagged
  const taggedCount = await prisma.registration.count({
    where: { attendanceTagsApplied: true }
  });
  
  const notTaggedCount = await prisma.registration.count({
    where: { attendanceTagsApplied: false }
  });
  
  console.log(`\nTotal tagged: ${taggedCount}`);
  console.log(`Total not tagged: ${notTaggedCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
