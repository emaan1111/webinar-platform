const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const ew = await prisma.externalWebinar.findMany({ include: { _count: { select: { registrations: true } } } });
  ew.forEach(e => console.log(e.name + ': ' + e._count.registrations));
}
main();
