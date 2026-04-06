const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const regId = process.argv[2];
  if (!regId) {
    console.log('Usage: node scripts/reset-tag-flag.js <registrationId>');
    process.exit(1);
  }

  const result = await prisma.registration.update({
    where: { id: regId },
    data: {
      attendanceTagsApplied: false,
      attendanceTagsAppliedAt: null
    }
  });

  console.log('Reset attendanceTagsApplied for:', result.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
