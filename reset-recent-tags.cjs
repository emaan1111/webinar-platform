const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Reset specific registrations that need reprocessing with the fix
async function main() {
  // Reset registrations tagged in the last 30 minutes (when we ran the buggy retag)
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
  
  const result = await prisma.registration.updateMany({
    where: {
      attendanceTagsApplied: true,
      attendanceTagsAppliedAt: {
        gte: thirtyMinAgo
      }
    },
    data: {
      attendanceTagsApplied: false,
      attendanceTagsAppliedAt: null
    }
  });
  
  console.log(`Reset ${result.count} registrations from the last 30 minutes`);
  
  // Also reset all tagged in the last 3 days that might have been affected
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  
  const result2 = await prisma.registration.updateMany({
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
  
  console.log(`Reset ${result2.count} more registrations from the last 3 days`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
