const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Check how many registrations are ready to be reprocessed
  const now = new Date();
  
  const ready = await prisma.registration.findMany({
    where: {
      attendanceTagsApplied: false,
      scheduledStartTime: { not: null }
    },
    select: {
      id: true,
      email: true,
      scheduledStartTime: true,
      attended: true,
      webinar: {
        select: {
          duration: true
        }
      }
    },
    take: 20
  });
  
  console.log(`Found ${ready.length} registrations with attendanceTagsApplied=false\n`);
  
  for (const reg of ready) {
    const sessionEndTime = new Date(
      reg.scheduledStartTime.getTime() + 
      (reg.webinar.duration * 60 * 1000)
    );
    
    const hasEnded = sessionEndTime < now;
    
    console.log(`Email: ${reg.email}`);
    console.log(`  Scheduled: ${reg.scheduledStartTime}`);
    console.log(`  Duration: ${reg.webinar.duration} min`);
    console.log(`  Session end: ${sessionEndTime}`);
    console.log(`  Has ended: ${hasEnded}`);
    console.log(`  Attended: ${reg.attended}`);
    console.log('');
  }
  
  // Also count totals
  const totalNotTagged = await prisma.registration.count({
    where: { attendanceTagsApplied: false }
  });
  
  const totalTagged = await prisma.registration.count({
    where: { attendanceTagsApplied: true }
  });
  
  console.log('--- TOTALS ---');
  console.log(`Not tagged (attendanceTagsApplied=false): ${totalNotTagged}`);
  console.log(`Tagged (attendanceTagsApplied=true): ${totalTagged}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
