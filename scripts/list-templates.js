const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const templates = await prisma.thankYouTemplate.findMany({
    select: { id: true, name: true, isSystem: true }
  });
  console.log('Templates in database:');
  templates.forEach(t => console.log('  -', t.name, '(' + t.id + ')', t.isSystem ? '[System]' : ''));
  await prisma.$disconnect();
}
main();
