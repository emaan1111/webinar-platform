const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const t = await prisma.countdownTemplate.findFirst({ where: { name: 'GREEN' }});
  if (t) {
    console.log('Template name:', t.name);
    console.log('Has video-container:', t.htmlCode.includes('video-container'));
    console.log('Has video-player:', t.htmlCode.includes('video-player'));
    console.log('Has unmute-prompt:', t.htmlCode.includes('unmute-prompt'));
    console.log('\nFirst 800 chars:\n', t.htmlCode.substring(0, 800));
  }
  await prisma.$disconnect();
}
check();
