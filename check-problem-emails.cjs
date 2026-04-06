const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const problemEmails = [
  'ayeshafomar786@gmail.com',
  'sarasoso982015@gmail.com',
  'faridaakter190@gmail.com'
];

async function main() {
  for (const email of problemEmails) {
    const reg = await prisma.registration.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: {
        email: true,
        attended: true,
        lastWatchedPosition: true,
        attendanceTagsApplied: true,
        attendanceTagsAppliedAt: true
      },
      orderBy: { registeredAt: 'desc' }
    });
    
    console.log(`${email}:`);
    console.log(`  attendanceTagsApplied: ${reg?.attendanceTagsApplied}`);
    console.log(`  attendanceTagsAppliedAt: ${reg?.attendanceTagsAppliedAt}`);
    console.log('');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
