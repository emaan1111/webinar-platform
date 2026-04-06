const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find registrations that were "tagged" in the last 3 days
  // and reset them so they can be reprocessed
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  
  const result = await prisma.registration.updateMany({
    where: {
      attendanceTagsApplied: true,
      attendanceTagsAppliedAt: {
        gte: threeDaysAgo
      }
    },
    data: {
      attendanceTagsApplied: false,
      attendanceTagsAppliedAt: null
    }
  });
  
  console.log(`Reset ${result.count} registrations for reprocessing`);
  console.log('Run the attendance tagging cron to re-apply tags');
}

main().catch(console.error).finally(() => prisma.$disconnect());
