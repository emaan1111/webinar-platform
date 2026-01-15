
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const WEBINAR_ID = 'cmkf76kdp00ixjw83w77brbdp';

async function main() {
  console.log(`Updating webinar config for ID: ${WEBINAR_ID}...`);
  
  // We only know the Missed Tag ID for sure right now
  const updates = {
    missedTagId: 387797,
    // Ensure others are null so they trigger lookup by name in production
    registrationTagId: null,
    attendedTagId: null,
    mostlyAttendedTagId: null,
    partlyAttendedTagId: null,
    replayAttendedTagId: null
  };

  await prisma.webinar.update({
    where: { id: WEBINAR_ID },
    data: updates
  });
  
  console.log('✅ Successfully updated missedTagId to 387797');
  console.log('⚠️  Other tag IDs set to NULL (will auto-resolve in production)');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
