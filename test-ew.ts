import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const ew = await prisma.externalWebinar.findMany({ include: { _count: { select: { registrations: true } } } });
  console.log(ew.map(e => `${e.name}: ${e._count.registrations}`));
}
main();
