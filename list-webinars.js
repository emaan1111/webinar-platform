const { PrismaClient } = require('@prisma/client');
(async function(){
  const prisma = new PrismaClient();
  const webinars = await prisma.webinar.findMany({ select: { id: true, title: true, slug: true, status: true, internalName: true } });
  console.log('Webinars:');
  webinars.forEach(w => console.log(` - ${w.title} [${w.slug}] status=${w.status}`));
  await prisma.$disconnect();
})();
