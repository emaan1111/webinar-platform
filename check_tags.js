
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const EMAIL = '121111emaanpower@gmail.com';

async function main() {
  const registrations = await prisma.registration.findMany({
    where: { email: EMAIL },
    include: {
      webinar: true,
      sessions: true
    }
  });

  console.log(`Found ${registrations.length} registrations for ${EMAIL}`);
  
  registrations.forEach((reg, index) => {
    console.log(`\n--- Registration #${index + 1} ---`);
    console.log(`ID: ${reg.id}`);
    console.log(`Webinar: ${reg.webinar.title}`);
    console.log(`Scheduled Start: ${reg.scheduledStartTime}`);
    console.log(`Attendance Tags Applied: ${reg.attendanceTagsApplied} (at ${reg.attendanceTagsAppliedAt})`);
    
    // Calculate total watch time
    const totalWatch = reg.sessions.reduce((sum, s) => sum + (s.watchDuration || s.totalWatchTime || 0), 0);
    console.log(`Total Watch Time: ${totalWatch}s`);
    console.log(`Last Watch Pos: ${reg.lastWatchedPosition}`);
    console.log(`Diff: ${reg.sessions.length} sessions`);
    
    // Replay Info
    console.log(`Watched Replay: ${reg.watchedReplay}`);
    console.log(`Replay Watch Time: ${reg.replayWatchTime}`);
    
    // Config
    console.log(`Mostly Threshold: ${reg.webinar.mostlyAttendedThreshold}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
