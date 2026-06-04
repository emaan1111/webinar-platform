const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const exts = await prisma.externalWebinarRegistration.findMany({take: 5});
  console.log(exts.map(e => e.id));
}
main().finally(() => prisma.$disconnect());
